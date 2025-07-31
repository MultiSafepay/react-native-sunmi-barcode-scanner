package expo.modules.sunmibarcodescanner

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.*
import expo.modules.kotlin.Promise

enum class SunmiBarcodeScannerException(val code: String) {
    COOLDOWN_ACTIVE("COOLDOWN_ACTIVE"),
    SCAN_CANCELLED("SCAN_CANCELLED"),
    SCAN_TIMEOUT("SCAN_TIMEOUT"),
    SCAN_ERROR("SCAN_ERROR")
}

enum class ScannerOperationMode(val modeName: String) {
    ON_DEMAND("ON_DEMAND"),
    CONTINUOUS("CONTINUOUS")
}

class SunmiBarcodeScanner {
    
    companion object {
        private const val DEFAULT_TIMEOUT = 10000L
        private const val SCAN_COOLDOWN = 2000L
        private const val ACTION_DATA_CODE_RECEIVED = "com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED"
        private const val ACTION_SCANNER_SERIAL_SETTING = "com.sunmi.scanner.ACTION_SCANNER_SERIAL_SETTING"
        private const val ACTION_SEND_COMMAND = "com.sunmi.scanner.Setting_cmd"
        private const val DATA_KEY = "data"
        
        // Serial command constants (from Sunmi's official docs)
        private const val PREFIX_HEX = "7E0130303030" // ~<SOH>0000
        private const val SUFFIX_HEX = "3B03" // ;<ETX>
        private const val STORAGE_TEMP_HEX = "23" // # temporary setting
        private const val STORAGE_EVER_HEX = "40" // @ permanent setting
    }

    private var scanJob: Job? = null
    private var lastScanTime = 0L
    private var scanTimeout = DEFAULT_TIMEOUT
    private var beepEnabled = true
    private var operationMode = ScannerOperationMode.CONTINUOUS
    private var broadcastReceiver: BroadcastReceiver? = null
    private var pendingPromise: Promise? = null
    private var isReceiverRegistered = false
    private var context: Context? = null
    private var isInitialized = false

    @OptIn(DelicateCoroutinesApi::class)
    fun scanQRCode(context: Context, promise: Promise) {
        // Initialize scanner if not done yet
        if (!isInitialized) {
            initializeScanner(context)
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
        
        // Unregister broadcast receiver
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
     * Initialize scanner in ON_DEMAND mode (disabled by default)
     * This should be called when the app starts
     */
    fun initializeScanner(context: Context) {
        if (isInitialized) return
        
        // Enable broadcast output for serial scanner
        val intent = Intent(ACTION_SCANNER_SERIAL_SETTING).apply {
            putExtra("analog_key", false)  // Disable keyboard output
            putExtra("broadcast", true)    // Enable broadcast output
            putExtra("toast", false)       // No toast messages
        }
        context.sendBroadcast(intent)

        // Apply current operation mode (default is ON_DEMAND)
        applyOperationModeSettings(context, operationMode)
        
        // Enable buzzer if requested
        if (beepEnabled) {
            sendSerialCommand(context, "@GRBENA1")
        }
        
        isInitialized = true
    }

    private fun setupBroadcastReceiver(context: Context) {
        if (isReceiverRegistered) return

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
    }
}