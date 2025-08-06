package expo.modules.sunmibarcodescanner

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.usb.UsbDevice
import android.hardware.usb.UsbManager
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.*
import expo.modules.kotlin.Promise

enum class SunmiBarcodeScannerException(val code: String) {
    COOLDOWN_ACTIVE("COOLDOWN_ACTIVE"),
    SCAN_CANCELLED("SCAN_CANCELLED"),
    SCAN_TIMEOUT("SCAN_TIMEOUT"),
    SCAN_ERROR("SCAN_ERROR"),
    USB_DISCONNECTED("USB_DISCONNECTED"),
    USB_NOT_FOUND("USB_NOT_FOUND"),
    SERIAL_NOT_AVAILABLE("SERIAL_NOT_AVAILABLE"),
    NO_SCANNERS_AVAILABLE("NO_SCANNERS_AVAILABLE"),
    SCANNER_BUSY("SCANNER_BUSY")
}

enum class ScannerOperationMode(val modeName: String) {
    ON_DEMAND("ON_DEMAND"),
    CONTINUOUS("CONTINUOUS")
}

enum class ScannerType(val typeName: String) {
    SERIAL("SERIAL"),
    USB("USB"),
    BOTH("BOTH"),
    NONE("NONE")
}

enum class ScannerPriority(val priorityName: String) {
    PREFER_USB("PREFER_USB"),
    PREFER_SERIAL("PREFER_SERIAL"),
    USB_ONLY("USB_ONLY"),
    SERIAL_ONLY("SERIAL_ONLY")
}

data class ScannerInfo(
    val type: ScannerType,
    val isConnected: Boolean,
    val deviceName: String?,
    val pid: Int?,
    val vid: Int?
)

class SunmiBarcodeScanner {
    
    companion object {
        private const val DEFAULT_TIMEOUT = 10000L
        private const val SCAN_COOLDOWN = 2000L
        private const val ACTION_DATA_CODE_RECEIVED = "com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED"
        private const val ACTION_SCANNER_SERIAL_SETTING = "com.sunmi.scanner.ACTION_SCANNER_SERIAL_SETTING"
        private const val ACTION_SEND_COMMAND = "com.sunmi.scanner.Setting_cmd"
        private const val ACTION_USB_DEVICE_SETTING = "com.sunmi.scanner.ACTION_BAR_DEVICES_SETTING"
        private const val DATA_KEY = "data"
        
        // Default USB scanner VID/PID combinations from Sunmi's official documentation
        // These can be extended dynamically via addCompatibleUsbScanner API
        private val DEFAULT_USB_SCANNER_IDENTIFIERS = listOf(
            "4608,1504",   // 0x1200,0x05E0 - Symbol scanner
            "9492,1529",   // 0x2514,0x05F9 - POS scanner  
            "34,12879",    // 0x0022,0x324F - SM-S100W
            "193,12879"    // 0x00C1,0x324F - SM-S100W variant
        )
    }

    private var scanJob: Job? = null
    private var lastScanTime = 0L
    private var scanTimeout = DEFAULT_TIMEOUT
    private var beepEnabled = true
    private var toastEnabled = false
    private var operationMode = ScannerOperationMode.CONTINUOUS
    private var scannerPriority = ScannerPriority.PREFER_USB
    private var activeScannerType = ScannerType.NONE
    private var broadcastReceiver: BroadcastReceiver? = null
    private var pendingPromise: Promise? = null
    private var isReceiverRegistered = false
    private var context: Context? = null
    private var isInitialized = false
    
    // Dynamic list of compatible USB scanner identifiers
    private val compatibleUsbScanners = mutableListOf<String>().apply {
        addAll(DEFAULT_USB_SCANNER_IDENTIFIERS)
    }

    @OptIn(DelicateCoroutinesApi::class)
    fun scanQRCode(context: Context, promise: Promise) {
        // Initialize scanner if not done yet
        if (!isInitialized) {
            initializeScanner(context)
        }
        
        // Check if scanner is available
        if (activeScannerType == ScannerType.NONE) {
            promise.rejectWithSunmiError(SunmiBarcodeScannerException.NO_SCANNERS_AVAILABLE, "No compatible scanners found")
            return
        }
        
        // Check cooldown period
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastScanTime < SCAN_COOLDOWN) {
            promise.rejectWithSunmiError(SunmiBarcodeScannerException.COOLDOWN_ACTIVE, "Please wait before scanning again")
            return
        }

        // Cancel any existing scan
        cancelScan(context, null)

        // Store context and promise for broadcast receiver
        this.context = context
        this.pendingPromise = promise

        // Handle scanning based on active scanner type
        when (activeScannerType) {
            ScannerType.USB -> {
                handleUsbScanning(context, promise)
            }
            ScannerType.SERIAL -> {
                handleSerialScanning(context, promise)
            }
            else -> {
                promise.rejectWithSunmiError(SunmiBarcodeScannerException.SCAN_ERROR, "Invalid scanner type: $activeScannerType")
            }
        }
    }

    /**
     * Handle scanning for USB scanners
     */
    private fun handleUsbScanning(context: Context, promise: Promise) {
        // Verify USB scanner is still connected
        val usbScanners = detectUsbScanners(context)
        if (usbScanners.isEmpty()) {
            promise.rejectWithSunmiError(SunmiBarcodeScannerException.USB_DISCONNECTED, "USB scanner disconnected")
            return
        }
        
        // Setup broadcast receiver for USB scanner (same as serial)
        setupBroadcastReceiver(context)
        
        // Set timeout (USB scanners typically use default timeout)
        val effectiveTimeout = scanTimeout
        
        // Start scan timeout
        scanJob = GlobalScope.launch(Dispatchers.Main) {
            try {
                delay(effectiveTimeout)
                // Timeout reached
                cleanupScan()
                promise.rejectWithSunmiError(SunmiBarcodeScannerException.SCAN_TIMEOUT, "Scan timeout after ${effectiveTimeout}ms")
            } catch (e: CancellationException) {
                // Scan was cancelled or completed
            }
        }
    }

    /**
     * Handle scanning for Serial scanners
     */
    private fun handleSerialScanning(context: Context, promise: Promise) {
        // Setup broadcast receiver
        setupBroadcastReceiver(context)
        
        // Configure scanner current operation mode
        applyOperationModeSettings(context, operationMode)

        // Set timeout based on operation mode
        val effectiveTimeout = when (operationMode) {
            ScannerOperationMode.ON_DEMAND -> 30000L  // 30 seconds to match @ORTSET30000
            ScannerOperationMode.CONTINUOUS -> scanTimeout  // Use configured timeout (default 10s)
        }

        // Start scan timeout
        scanJob = GlobalScope.launch(Dispatchers.Main) {
            try {
                delay(effectiveTimeout)
                // Timeout reached
                cleanupScan()
                promise.rejectWithSunmiError(SunmiBarcodeScannerException.SCAN_TIMEOUT, "Scan timeout after ${effectiveTimeout}ms")
            } catch (e: CancellationException) {
                // Scan was cancelled or completed
            }
        }
    }

    fun cancelScan(context: Context, promise: Promise?) {
        cleanupScan()
        promise?.resolve(true)
    }

    private fun cleanupScan() {
        scanJob?.cancel()
        scanJob = null
        pendingPromise = null
        
        // Cleanup broadcast receiver for both USB and Serial scanners
        if (isReceiverRegistered && broadcastReceiver != null && context != null) {
            try {
                context?.unregisterReceiver(broadcastReceiver)
                isReceiverRegistered = false
            } catch (e: Exception) {
                // Receiver may not be registered
            }
        }
        
        // Only send stop scan command in ON_DEMAND mode (trigger mode)
        // In continuous mode, we don't want to interfere with the scanner
        if (operationMode == ScannerOperationMode.ON_DEMAND) {
            context?.let { stopScan(it) }
        }
    }

    fun setScanTimeout(timeout: Long) {
        scanTimeout = timeout
    }

    fun setBeep(enabled: Boolean) {
        beepEnabled = enabled
    }

    fun setToast(enabled: Boolean) {
        toastEnabled = enabled
    }

    fun getToast(): Boolean {
        return toastEnabled
    }

    /**
     * Get all USB devices connected to the system
     */
    fun getAllUsbDevices(context: Context): List<Map<String, Any?>> {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val deviceList = usbManager.deviceList
        val devices = mutableListOf<Map<String, Any?>>()
        
        for (device in deviceList.values) {
            devices.add(mapOf(
                "deviceName" to device.deviceName,
                "vendorId" to device.vendorId,
                "productId" to device.productId,
                "pidVidKey" to "${device.productId},${device.vendorId}",
                "deviceClass" to device.deviceClass,
                "deviceSubclass" to device.deviceSubclass,
                "deviceProtocol" to device.deviceProtocol,
                "interfaceCount" to device.interfaceCount,
                "isCompatible" to compatibleUsbScanners.contains("${device.productId},${device.vendorId}")
            ))
        }
        
        return devices
    }

    /**
     * Add a USB scanner to the compatible list
     */
    fun addCompatibleUsbScanner(productId: Int, vendorId: Int): Boolean {
        val pidVidKey = "$productId,$vendorId"
        return if (!compatibleUsbScanners.contains(pidVidKey)) {
            compatibleUsbScanners.add(pidVidKey)
            true
        } else {
            false // Already exists
        }
    }

    /**
     * Remove a USB scanner from the compatible list
     */
    fun removeCompatibleUsbScanner(productId: Int, vendorId: Int): Boolean {
        val pidVidKey = "$productId,$vendorId"
        return compatibleUsbScanners.remove(pidVidKey)
    }

    /**
     * Get the current list of compatible USB scanner identifiers
     */
    fun getCompatibleUsbScanners(): List<String> {
        return compatibleUsbScanners.toList()
    }

    /**
     * Reset compatible USB scanners to default list
     */
    fun resetCompatibleUsbScanners() {
        compatibleUsbScanners.clear()
        compatibleUsbScanners.addAll(DEFAULT_USB_SCANNER_IDENTIFIERS)
    }

    /**
     * Set data distribution type following SunmiScanner.java approach
     * USB scanners default to TYPE_KEYBOARD, don't support TYPE_KEYBOARD_AND_BROADCAST
     * Serial scanners default to TYPE_KEYBOARD_AND_BROADCAST, support all parameters
     */
    fun setDataDistributeType(context: Context, type: String) {
        // Convert string to internal type values
        val usbType: Int
        val serialKeyboard: Boolean
        val serialBroadcast: Boolean
        
        when (type) {
            "TYPE_KEYBOARD" -> {
                usbType = 0
                serialKeyboard = true
                serialBroadcast = false
            }
            "TYPE_BROADCAST" -> {
                usbType = 2
                serialKeyboard = false
                serialBroadcast = true
            }
            "TYPE_KEYBOARD_AND_BROADCAST" -> {
                usbType = 0  // USB doesn't support both, defaults to keyboard
                serialKeyboard = true
                serialBroadcast = true
            }
            else -> {
                throw Exception("Invalid data distribute type: $type")
            }
        }
        
        // 1. Configure USB scanners (following SunmiScanner.java approach)
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val deviceList = usbManager.deviceList
        
        for (device in deviceList.values) {
            val pidVidKey = "${device.productId},${device.vendorId}"
            if (compatibleUsbScanners.contains(pidVidKey)) {
                val intent = Intent(ACTION_USB_DEVICE_SETTING).apply {
                    putExtra("name", device.deviceName ?: "")
                    putExtra("pid", device.productId)
                    putExtra("vid", device.vendorId)
                    putExtra("type", usbType)
                    putExtra("toast", toastEnabled)
                }
                context.sendBroadcast(intent)
            }
        }
        
        // 2. Configure Serial scanner
        val serialIntent = Intent(ACTION_SCANNER_SERIAL_SETTING).apply {
            putExtra("analog_key", serialKeyboard)
            putExtra("broadcast", serialBroadcast)
            putExtra("toast", toastEnabled)
        }
        context.sendBroadcast(serialIntent)
    }
    /**
     * Set USB scanner mode (for testing different modes)
     * 0 = Keyboard, 1 = KeyEvent, 2 = Broadcast, 3 = Acceleration (requires 1.0.18+)
     */
    fun setUsbScannerMode(context: Context, mode: Int) {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val deviceList = usbManager.deviceList
        
        // Find and configure all USB scanners (following SunmiScanner.java approach)
        for (device in deviceList.values) {
            val pidVidKey = "${device.productId},${device.vendorId}"
            if (compatibleUsbScanners.contains(pidVidKey)) {
                val intent = Intent(ACTION_USB_DEVICE_SETTING).apply {
                    putExtra("name", device.deviceName ?: "")  // Use actual device name or empty
                    putExtra("pid", device.productId)
                    putExtra("vid", device.vendorId)
                    putExtra("type", mode)
                    putExtra("toast", toastEnabled)
                }
                context.sendBroadcast(intent)
            }
        }
    }

    /**
     * Set scanner operation mode (ON_DEMAND or CONTINUOUS)
     */
    fun setScannerOperationMode(context: Context, mode: ScannerOperationMode) {
        operationMode = mode
        
        // Apply the mode immediately if scanner is initialized
        if (isInitialized) {
            applyOperationModeSettings(context, mode)
        }
    }

    /**
     * Apply operation mode settings - shared between initialization and mode switching
     */
    private fun applyOperationModeSettings(context: Context, mode: ScannerOperationMode) {
        when (mode) {
            ScannerOperationMode.ON_DEMAND -> {
                sendSerialCommand(context, "@SCNMOD0")     // Trigger mode
                // Trigger one scan - scanner will automatically turn off after scan or timeout
                sendSerialCommand(context, "#SCNTRG1")
                sendSerialCommand(context, "@ORTSET30000") // 30 second wait time
                sendSerialCommand(context, "@RRDDUR1000")  // 1000ms same code interval
            }
            ScannerOperationMode.CONTINUOUS -> {
                sendSerialCommand(context, "@SCNMOD2")    // Auto sense mode
                sendSerialCommand(context, "@ORTSET800") // 800ms wait time
                sendSerialCommand(context, "@RRDDUR1000") // 1000ms same code interval
            }
        }
    }

    /**
     * Get current scanner operation mode
     */
    fun getScannerOperationMode(): ScannerOperationMode {
        return operationMode
    }

    /**
     * Set scanner priority (USB vs Serial preference)
     */
    fun setScannerPriority(context: Context, priority: ScannerPriority) {
        scannerPriority = priority
        if (isInitialized) {
            // Re-initialize with new priority
            reinitializeWithPriority(context)
        }
    }

    /**
     * Get current scanner priority
     */
    fun getScannerPriority(): ScannerPriority {
        return scannerPriority
    }

    /**
     * Get available scanners
     */
    fun getAvailableScanners(context: Context): List<ScannerInfo> {
        val scanners = mutableListOf<ScannerInfo>()
        
        // Check USB scanners dynamically (following SunmiScanner.java approach)
        val usbScanners = detectUsbScanners(context)
        usbScanners.forEach { device ->
            scanners.add(ScannerInfo(
                type = ScannerType.USB,
                isConnected = true,
                deviceName = device.deviceName ?: "USB Scanner",
                pid = device.productId,
                vid = device.vendorId
            ))
        }
        
        // Check Serial scanner (assume available if no USB or both supported)
        scanners.add(ScannerInfo(
            type = ScannerType.SERIAL,
            isConnected = true, // We can't easily detect serial availability
            deviceName = "Serial Scanner",
            pid = null,
            vid = null
        ))
        
        return scanners
    }

    /**
     * Get currently active scanner type
     */
    fun getCurrentScannerType(): ScannerType {
        return activeScannerType
    }

    /**
     * Get the optimal scanner type that would be selected based on current priority and availability
     * This is useful for debugging and understanding which scanner will be used without initializing
     */
    fun getOptimalScannerType(context: Context): ScannerType {
        return selectOptimalScanner(context)
    }

    /**
     * Detect USB scanners by checking VID/PID against compatible scanners list
     * Following the same approach as SunmiScanner.java - dynamic detection
     */
    private fun detectUsbScanners(context: Context): List<UsbDevice> {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val deviceList = usbManager.deviceList
        val detectedScanners = mutableListOf<UsbDevice>()
        
        for (device in deviceList.values) {
            val pidVidKey = "${device.productId},${device.vendorId}"
            if (compatibleUsbScanners.contains(pidVidKey)) {
                detectedScanners.add(device)
            }
        }
        
        return detectedScanners
    }

    /**
     * Select optimal scanner based on priority and availability
     */
    private fun selectOptimalScanner(context: Context): ScannerType {
        val availableUsb = detectUsbScanners(context)
        val hasUsb = availableUsb.isNotEmpty()
        val hasSerial = true // Assume serial is always available on Sunmi devices
        
        return when (scannerPriority) {
            ScannerPriority.PREFER_USB -> {
                when {
                    hasUsb -> ScannerType.USB
                    hasSerial -> ScannerType.SERIAL
                    else -> ScannerType.NONE
                }
            }
            ScannerPriority.PREFER_SERIAL -> {
                when {
                    hasSerial -> ScannerType.SERIAL
                    hasUsb -> ScannerType.USB
                    else -> ScannerType.NONE
                }
            }
            ScannerPriority.USB_ONLY -> {
                if (hasUsb) ScannerType.USB else ScannerType.NONE
            }
            ScannerPriority.SERIAL_ONLY -> {
                if (hasSerial) ScannerType.SERIAL else ScannerType.NONE
            }
        }
    }

    /**
     * Reinitialize scanner with new priority
     */
    private fun reinitializeWithPriority(context: Context) {
        val newScannerType = selectOptimalScanner(context)
        if (newScannerType != activeScannerType) {
            activeScannerType = newScannerType
            configureSelectedScanner(context, activeScannerType)
        }
    }

    /**
     * Initialize scanner with automatic detection and priority-based selection
     * This should be called when the app starts
     */
    fun initializeScanner(context: Context) {
        if (isInitialized) return
        
        // Detect and select optimal scanner
        activeScannerType = selectOptimalScanner(context)
        
        if (activeScannerType == ScannerType.NONE) {
            throw Exception("No compatible scanners found")
        }
        
        // Configure the selected scanner
        configureSelectedScanner(context, activeScannerType)
        
        isInitialized = true
    }

    /**
     * Configure scanner based on selected type (USB or Serial)
     */
    private fun configureSelectedScanner(context: Context, scannerType: ScannerType) {
        when (scannerType) {
            ScannerType.USB -> {
                configureUsbScanner(context)
            }
            ScannerType.SERIAL -> {
                configureSerialScanner(context)
            }
            else -> {
                throw Exception("Invalid scanner type for configuration: $scannerType")
            }
        }
    }

    /**
     * Configure USB scanner using dynamic detection (following SunmiScanner.java approach)
     */
    private fun configureUsbScanner(context: Context) {
        val usbManager = context.getSystemService(Context.USB_SERVICE) as UsbManager
        val deviceList = usbManager.deviceList
        var configuredCount = 0
        
        // For USB scanners, we'll primarily use broadcast mode (type 2)
        // This avoids the complexity of KeyEvent handling in Expo modules
        val usbDataType = 2  // Broadcast mode
        
        for (device in deviceList.values) {
            val pidVidKey = "${device.productId},${device.vendorId}"
            if (compatibleUsbScanners.contains(pidVidKey)) {
                val intent = Intent(ACTION_USB_DEVICE_SETTING).apply {
                    putExtra("name", device.deviceName ?: "")  // Use actual device name
                    putExtra("pid", device.productId)
                    putExtra("vid", device.vendorId)
                    putExtra("type", usbDataType)
                    putExtra("toast", toastEnabled)
                }
                context.sendBroadcast(intent)
                configuredCount++
            }
        }
        
        if (configuredCount == 0) {
            throw Exception("No USB scanners found to configure")
        }
        
        // Setup broadcast receiver for USB scanners (same as serial)
        setupBroadcastReceiver(context)
    }

    /**
     * Configure Serial scanner (existing implementation)
     */
    private fun configureSerialScanner(context: Context) {
        // Enable broadcast output for serial scanner
        val intent = Intent(ACTION_SCANNER_SERIAL_SETTING).apply {
            putExtra("analog_key", false)  // Disable keyboard output
            putExtra("broadcast", true)    // Enable broadcast output
            putExtra("toast", toastEnabled)       // Use dynamic toast setting
        }
        context.sendBroadcast(intent)

        // Apply current operation mode
        applyOperationModeSettings(context, operationMode)
        
        // Enable buzzer if requested
        if (beepEnabled) {
            sendSerialCommand(context, "@GRBENA1")
        }
    }

    private fun setupBroadcastReceiver(context: Context) {
        if (isReceiverRegistered) {
            return
        }

        broadcastReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                val data = intent?.getStringExtra(DATA_KEY)
                if (data != null && data.isNotEmpty() && isValidQRCode(data)) {
                    handleScanResult(data)
                }
            }
        }

        val filter = IntentFilter().apply {
            addAction(ACTION_DATA_CODE_RECEIVED)
        }
        
        // Register with RECEIVER_NOT_EXPORTED for Android 14+ compatibility
        if (android.os.Build.VERSION.SDK_INT >= 34) { // Android 14 (API 34)
            context.registerReceiver(broadcastReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            context.registerReceiver(broadcastReceiver, filter)
        }
        isReceiverRegistered = true
    }

    private fun handleScanResult(data: String) {
        lastScanTime = System.currentTimeMillis()
        
        if (beepEnabled) {
            playBeep()
        }
        
        val promise = pendingPromise
        cleanupScan()
        promise?.resolve(data)
    }

    private fun stopScan(context: Context) {
        // Stop scanning - only works in trigger mode (@SCNMOD0)
        // According to Sunmi docs, #SCNTRG0 only works when scanner is in trigger mode
        sendSerialCommand(context, "#SCNTRG0")
    }

    private fun sendSerialCommand(context: Context, command: String) {
        try {
            val bytes = command.toByteArray()
            val cmd = ByteArray(bytes.size + 2)
            System.arraycopy(bytes, 0, cmd, 0, bytes.size)
            lrcCheckSum(cmd)

            val intent = Intent(ACTION_SEND_COMMAND).apply {
                putExtra("cmd_data", cmd)
            }
            context.sendBroadcast(intent)
        } catch (e: Exception) {
            // Ignore command errors
        }
    }

    private fun lrcCheckSum(content: ByteArray) {
        val len = content.size
        var crc = 0
        for (i in 0 until len - 2) {
            crc += content[i].toInt() and 0xFF
        }
        crc = crc.inv() + 1
        content[len - 2] = ((crc shr 8) and 0xFF).toByte()
        content[len - 1] = (crc and 0xFF).toByte()
    }

    private fun isValidQRCode(data: String): Boolean {
        // Basic validation - QR codes should have reasonable length
        return data.length in 1..4296 && data.isNotBlank()
    }

    private fun playBeep() {
        // Use Android ToneGenerator or MediaPlayer
        Handler(Looper.getMainLooper()).post {
            try {
                val toneGen = android.media.ToneGenerator(
                    android.media.AudioManager.STREAM_NOTIFICATION, 100
                )
                toneGen.startTone(android.media.ToneGenerator.TONE_PROP_BEEP, 150)
                Handler(Looper.getMainLooper()).postDelayed({
                    toneGen.release()
                }, 200)
            } catch (e: Exception) {
                // Ignore audio errors
            }
        }
    }

    private fun Promise.rejectWithSunmiError(exception: SunmiBarcodeScannerException, reason: String?) {
        reject(exception.code, reason, null)
    }

    // Cleanup method to be called when module is destroyed
    fun destroy() {
        cleanupScan()
        
        // Reset state
        isInitialized = false
        activeScannerType = ScannerType.NONE
    }
}