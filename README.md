# React Native Sunmi Barcode Scanner

A React Native Expo module for integrating with Sunmi barcode scanners on Android devices, specifically designed for Sunmi K2 kiosks and similar hardware.

## Features

- 🔧 **Dual Operation Modes**: Support for both ON_DEMAND and CONTINUOUS scanning modes
- 📱 **Cross-platform Safety**: Platform detection prevents crashes on non-Android devices
- ⚡ **Dual Scanner Support**: Automatic detection and support for both USB and Serial barcode scanners
- 🎯 **Smart Scanner Selection**: Configurable priority system (USB-first by default) with automatic fallback
- � **Dynamic USB Management**: Discover, add, and manage USB scanners without native code changes
- �🔊 **Configurable Audio**: Enable/disable scan beep sounds and toast notifications
- ⏱️ **Smart Timeouts**: Mode-aware timeout handling (30s for ON_DEMAND, configurable for CONTINUOUS)
- 🛡️ **Android 14+ Compatible**: Supports latest Android security requirements
- 🎯 **TypeScript Support**: Full TypeScript definitions included
- � **Data Distribution Control**: Configure keyboard/broadcast output modes for both USB and Serial scanners

## Installation

```bash
npm install https://github.com/MultiSafepay/react-native-sunmi-barcode-scanner#main
```

## Basic Usage

```typescript
import ReactNativeSunmiBarcodeScanner from "react-native-sunmi-barcode-scanner";

// Initialize the scanner (call once when app starts)
ReactNativeSunmiBarcodeScanner.initializeScanner();

// Scan a QR code
try {
  const result = await ReactNativeSunmiBarcodeScanner.scanQRCode();
  console.log("Scanned:", result);
} catch (error) {
  console.error("Scan failed:", error.message);
}
```

## 🚀 Dynamic USB Scanner Management

### Discover USB Devices

```typescript
// Get all connected USB devices with compatibility info
const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();
console.log("USB Devices:", devices);

// Example output:
// [
//   {
//     deviceName: "Datalogic Gryphon I GD4430 2D",
//     vendorId: 1529,  // 0x05F9
//     productId: 8710, // 0x2206
//     pidVidKey: "8710,1529",
//     isCompatible: false
//   }
// ]
```

### Add New Scanner Models

```typescript
// Add your specific scanner (e.g., Datalogic scanner)
const added = ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(
  8710,
  1529
);
console.log("Scanner added:", added);

// Remove a scanner
const removed = ReactNativeSunmiBarcodeScanner.removeCompatibleUsbScanner(
  8710,
  1529
);

// Get current compatible list
const compatible = ReactNativeSunmiBarcodeScanner.getCompatibleUsbScanners();
console.log("Compatible scanners:", compatible); // ["8710,1529", "4608,1504", ...]

// Reset to defaults
ReactNativeSunmiBarcodeScanner.resetCompatibleUsbScanners();
```

### USB Scanner Modes

```typescript
// Configure USB scanner data output mode
ReactNativeSunmiBarcodeScanner.setUsbScannerMode(2); // Broadcast mode (recommended)
// Modes: 0=Keyboard, 1=KeyEvent, 2=Broadcast, 3=Acceleration

// Set data distribution for all scanners
ReactNativeSunmiBarcodeScanner.setDataDistributeType("TYPE_BROADCAST");
// Types: "TYPE_KEYBOARD", "TYPE_BROADCAST", "TYPE_KEYBOARD_AND_BROADCAST"
```

## Scanner Types

This module automatically detects and supports both USB and Serial barcode scanners:

### USB Barcode Scanners

- **External USB scanners**: Datalogic, Symbol, Zebra, and other brands
- **Dynamic Detection**: Automatically discover any connected USB device
- **Flexible Configuration**: Add new scanner models without code changes
- **Multiple Output Modes**: Keyboard, broadcast, or hybrid data distribution
- **Real-time Management**: Add/remove scanners during app runtime

### Serial Barcode Scanners

- **Built-in scanners**: Most common on Sunmi devices
- **Full Command Support**: Complete operation mode control
- **Hardware Integration**: Native trigger and LED control
- **Broadcast Communication**: Uses Sunmi's official API

## 📋 Quick Setup for New USB Scanners

If you have a USB scanner that's not automatically detected:

1. **Connect your scanner** to the Sunmi device
2. **Run discovery** to see all USB devices:
   ```typescript
   const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();
   console.log(devices);
   ```
3. **Find your scanner** in the list and note its VID/PID
4. **Add it dynamically**:
   ```typescript
   ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(productId, vendorId);
   ```
5. **Start scanning** - your scanner is now ready to use!

### Example: Adding a Datalogic Scanner

```typescript
// Discover devices
const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();

// Find Datalogic scanner (example: VID=0x05F9, PID=0x2206)
const datalogicScanner = devices.find(
  (d) => d.vendorId === 0x05f9 && d.productId === 0x2206
);

if (datalogicScanner && !datalogicScanner.isCompatible) {
  // Add to compatible list
  ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(0x2206, 0x05f9);
  console.log("Datalogic scanner added!");
}
```

## Scanner Priority Configuration

By default, the module prefers USB scanners when both types are available. You can configure this behavior:

```typescript
// Set scanner priority
ReactNativeSunmiBarcodeScanner.setScannerPriority("PREFER_USB"); // Default
ReactNativeSunmiBarcodeScanner.setScannerPriority("PREFER_SERIAL"); // Prefer serial
ReactNativeSunmiBarcodeScanner.setScannerPriority("USB_ONLY"); // USB only
ReactNativeSunmiBarcodeScanner.setScannerPriority("SERIAL_ONLY"); // Serial only

// Get current priority
const priority = ReactNativeSunmiBarcodeScanner.getScannerPriority();

// Check available scanners
const scanners = await ReactNativeSunmiBarcodeScanner.getAvailableScanners();
console.log("Available scanners:", scanners);

// Get currently active scanner type
const activeType = ReactNativeSunmiBarcodeScanner.getCurrentScannerType();
console.log("Active scanner:", activeType); // "USB", "SERIAL", or "NONE"
```

## Operation Modes

### ON_DEMAND Mode (Default)

Scanner is inactive by default and only scans when explicitly triggered via `scanQRCode()`.

```typescript
// Set to ON_DEMAND mode
ReactNativeSunmiBarcodeScanner.setScannerOperationMode("ON_DEMAND");

// Trigger a single scan
const result = await ReactNativeSunmiBarcodeScanner.scanQRCode();
```

### CONTINUOUS Mode

Scanner continuously scans for barcodes. Call `scanQRCode()` to wait for the next scan result.

```typescript
// Set to CONTINUOUS mode
ReactNativeSunmiBarcodeScanner.setScannerOperationMode("CONTINUOUS");

// Wait for next scan (scanner is always active)
const result = await ReactNativeSunmiBarcodeScanner.scanQRCode();
```

## API Reference

### Core Methods

#### `initializeScanner(): void`

Initializes the scanner with default settings. Should be called once when the app starts.

#### `scanQRCode(): Promise<string>`

Scans for a QR code and returns the result. Behavior depends on current operation mode:

- **ON_DEMAND**: Triggers a single scan with 30-second timeout
- **CONTINUOUS**: Waits for next scan with configurable timeout

#### `cancelScan(): Promise<void>`

Cancels any active scan operation.

### 🔧 Configuration Methods

#### `setScannerOperationMode(mode: ScannerOperationMode): void`

Sets the scanner operation mode.

**Parameters:**

- `mode`: `"ON_DEMAND"` | `"CONTINUOUS"`

#### `getScannerOperationMode(): ScannerOperationMode`

Returns the current scanner operation mode.

#### `setScannerPriority(priority: ScannerPriority): void`

Sets the scanner priority for automatic scanner selection.

**Parameters:**

- `priority`: `"PREFER_USB"` | `"PREFER_SERIAL"` | `"USB_ONLY"` | `"SERIAL_ONLY"`

#### `getScannerPriority(): ScannerPriority`

Returns the current scanner priority setting.

#### `setScanTimeout(timeout: number): void`

Sets the scan timeout in milliseconds (applies to CONTINUOUS mode only).

#### `setBeep(enabled: boolean): void`

Enables or disables the scan beep sound.

#### `setToast(enabled: boolean): void`

Enables or disables toast notifications.

#### `getToast(): boolean`

Returns current toast notification setting.

### 🔍 Discovery Methods

#### `getAvailableScanners(): Promise<ScannerInfo[]>`

Returns a list of all detected scanners with their connection status and details.

#### `getCurrentScannerType(): ScannerType`

Returns the currently active scanner type: `"USB"` | `"SERIAL"` | `"NONE"`

#### `getAllUsbDevices(): Promise<UsbDeviceInfo[]>`

**🆕 NEW**: Get all connected USB devices with detailed information.

**Returns:**

```typescript
interface UsbDeviceInfo {
  deviceName: string | null;
  vendorId: number;
  productId: number;
  pidVidKey: string;
  deviceClass: number;
  deviceSubclass: number;
  deviceProtocol: number;
  interfaceCount: number;
  isCompatible: boolean;
}
```

### 🎯 USB Management Methods

#### `addCompatibleUsbScanner(productId: number, vendorId: number): boolean`

**🆕 NEW**: Add a USB scanner to the compatible list.

**Parameters:**

- `productId`: USB Product ID (PID)
- `vendorId`: USB Vendor ID (VID)

**Returns:** `true` if added, `false` if already exists

#### `removeCompatibleUsbScanner(productId: number, vendorId: number): boolean`

**🆕 NEW**: Remove a USB scanner from the compatible list.

#### `getCompatibleUsbScanners(): string[]`

**🆕 NEW**: Get current list of compatible USB scanner identifiers.

**Returns:** Array of "PID,VID" strings

#### `resetCompatibleUsbScanners(): void`

**🆕 NEW**: Reset compatible USB scanners to default Sunmi list.

### ⚙️ Advanced Configuration

#### `setUsbScannerMode(mode: number): void`

**🆕 NEW**: Set USB scanner data output mode for all compatible USB scanners.

**Parameters:**

- `mode`: `0` (Keyboard) | `1` (KeyEvent) | `2` (Broadcast) | `3` (Acceleration)

#### `setDataDistributeType(type: DataDistributeType): void`

**🆕 NEW**: Configure data distribution for both USB and Serial scanners.

**Parameters:**

- `type`: `"TYPE_KEYBOARD"` | `"TYPE_BROADCAST"` | `"TYPE_KEYBOARD_AND_BROADCAST"`

### Error Codes

**scanQRCode() Throws:**

- `PlatformNotSupportedError`: When called on non-Android platforms
- `COOLDOWN_ACTIVE`: When called too quickly (2-second cooldown)
- `SCAN_TIMEOUT`: When scan times out
- `SCAN_CANCELLED`: When scan is cancelled
- `USB_DISCONNECTED`: When USB scanner is unplugged during operation
- `USB_NOT_FOUND`: When USB_ONLY priority is set but no USB scanner is available
- `SERIAL_NOT_AVAILABLE`: When SERIAL_ONLY priority is set but serial scanner is unavailable
- `NO_SCANNERS_AVAILABLE`: When no compatible scanners are detected
- `SCANNER_BUSY`: When scanner is already in use

### Types

```typescript
type ScannerOperationMode = "ON_DEMAND" | "CONTINUOUS";
type ScannerPriority =
  | "PREFER_USB"
  | "PREFER_SERIAL"
  | "USB_ONLY"
  | "SERIAL_ONLY";
type ScannerType = "USB" | "SERIAL" | "BOTH" | "NONE";
type DataDistributeType =
  | "TYPE_KEYBOARD"
  | "TYPE_BROADCAST"
  | "TYPE_KEYBOARD_AND_BROADCAST";

interface ScannerInfo {
  type: ScannerType;
  isConnected: boolean;
  deviceName: string | null;
  pid: number | null;
  vid: number | null;
}

interface UsbDeviceInfo {
  deviceName: string | null;
  vendorId: number;
  productId: number;
  pidVidKey: string;
  deviceClass: number;
  deviceSubclass: number;
  deviceProtocol: number;
  interfaceCount: number;
  isCompatible: boolean;
}
```

## Complete Example

```typescript
import React, { useState, useEffect } from "react";
import { Alert, Button, View, Text } from "react-native";
import ReactNativeSunmiBarcodeScanner from "react-native-sunmi-barcode-scanner";

export default function App() {
  const [currentMode, setCurrentMode] = useState<"ON_DEMAND" | "CONTINUOUS">("ON_DEMAND");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerType, setScannerType] = useState<string>("NONE");
  const [usbDevices, setUsbDevices] = useState([]);

  useEffect(() => {
    // Initialize scanner when app starts
    ReactNativeSunmiBarcodeScanner.initializeScanner();

    // Get current mode and scanner info
    const mode = ReactNativeSunmiBarcodeScanner.getScannerOperationMode();
    setCurrentMode(mode);

    updateScannerInfo();
  }, []);

  const updateScannerInfo = async () => {
    // Get active scanner type
    const activeType = ReactNativeSunmiBarcodeScanner.getCurrentScannerType();
    setScannerType(activeType);

    // Get all USB devices
    try {
      const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();
      setUsbDevices(devices);
    } catch (error) {
      console.error("Error getting USB devices:", error);
    }
  };

  const handleScan = async () => {
    if (isScanning) return;

    setIsScanning(true);
    try {
      const result = await ReactNativeSunmiBarcodeScanner.scanQRCode();
      Alert.alert("Scan Result", result);
    } catch (error) {
      Alert.alert("Scan Error", error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const discoverAndAddUsbScanners = async () => {
    try {
      const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();
      const incompatible = devices.filter(d => !d.isCompatible);

      if (incompatible.length === 0) {
        Alert.alert("USB Discovery", "All connected USB devices are already compatible");
        return;
      }

      // Show discovered devices
      const deviceList = incompatible.map((d, i) =>
        `${i + 1}. ${d.deviceName || 'Unknown'}\n   VID: 0x${d.vendorId.toString(16)}, PID: 0x${d.productId.toString(16)}`
      ).join('\n\n');

      Alert.alert(
        "Add USB Scanner",
        `Found ${incompatible.length} new USB device(s):\n\n${deviceList}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add All",
            onPress: () => {
              let addedCount = 0;
              incompatible.forEach(device => {
                const added = ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(
                  device.productId,
                  device.vendorId
                );
                if (added) addedCount++;
              });
              Alert.alert("Success", `Added ${addedCount} USB scanner(s)`);
              updateScannerInfo();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const switchMode = (mode: "ON_DEMAND" | "CONTINUOUS") => {
    ReactNativeSunmiBarcodeScanner.setScannerOperationMode(mode);
    setCurrentMode(mode);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Sunmi Scanner Demo</Text>

      <Text>Mode: {currentMode}</Text>
      <Text>Active Scanner: {scannerType}</Text>
      <Text>USB Devices: {usbDevices.length} ({usbDevices.filter(d => d.isCompatible).length} compatible)</Text>

      {/* Operation Mode */}
      <View style={{ flexDirection: "row", gap: 10, marginVertical: 20 }}>
        <Button
          title="On-Demand"
          color={currentMode === "ON_DEMAND" ? "#28a032ff" : "#718faeff"}
          onPress={() => switchMode("ON_DEMAND")}
        />
        <Button
          title="Continuous"
          color={currentMode === "CONTINUOUS" ? "#28a032ff" : "#718faeff"}
          onPress={() => switchMode("CONTINUOUS")}
        />
      </View>

      {/* USB Management */}
      <View style={{ flexDirection: "row", gap: 10, marginVertical: 10 }}>
        <Button
          title="Discover USB"
          onPress={discoverAndAddUsbScanners}
        />
        <Button
          title="List USB Devices"
          onPress={async () => {
            const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();
            const info = devices.map(d =>
              `${d.deviceName || 'Unknown'} (${d.isCompatible ? '✓' : '✗'})`
            ).join('\n');
            Alert.alert("USB Devices", info || "No devices found");
          }}
        />
      </View>

      {/* Scanner Control */}
      <Button
        title={isScanning ? "Scanning..." : "Scan QR Code"}
        onPress={handleScan}
        disabled={isScanning}
      />
    </View>
  );
}
```

## Hardware Requirements

- Sunmi Android device (e.g., Sunmi K2 kiosk)
- Android API level 24 or higher
- Sunmi scanner service installed and running

### Supported Scanners

#### Serial Scanners

- ✅ **Built-in Sunmi scanners** (all models)
- ✅ **Automatic detection and configuration**

#### USB Scanners

- ✅ **Any USB HID barcode scanner** (with dynamic addition)
- ✅ **Default support for common Sunmi USB scanners**
- ✅ **Datalogic, Symbol, Zebra, and other brands** (add via API)
- ✅ **Runtime discovery and configuration**

#### Default USB Scanners (Pre-configured)

The module includes these USB scanners by default:

- `4608,1504` - Symbol scanner
- `9492,1529` - POS scanner
- `34,12879` - SM-S100W
- `193,12879` - SM-S100W variant

**🎯 For any other USB scanner**: Use the discovery API to detect and add your specific model!

## Technical Details

### Serial Scanner Commands Used

- `@SCNMOD0` - Trigger mode (ON_DEMAND)
- `@SCNMOD2` - Auto sense mode (CONTINUOUS)
- `#SCNTRG1` - Trigger single scan
- `#SCNTRG0` - Stop scanning
- `@ORTSET30000` - 30 second timeout for ON_DEMAND
- `@ORTSET800` - 800ms timeout for CONTINUOUS
- `@RRDDUR1000` - 1000ms same code interval
- `@GRBENA1` - Enable beep sound

### USB Scanner Configuration

- **Keyboard Mode (type: 0)**: KeyEvent processing for ON_DEMAND scanning
- **Broadcast Mode (type: 2)**: Broadcast intents for CONTINUOUS scanning (if supported)
- **PID/VID Detection**: Automatic detection of known USB scanner models
- **KeyEvent Timing**: 200ms delay for scan completion detection

### Broadcast Intents

- `com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED` - Receives scan results (Serial + USB broadcast)
- `com.sunmi.scanner.ACTION_SCANNER_SERIAL_SETTING` - Serial scanner configuration
- `com.sunmi.scanner.ACTION_BAR_DEVICES_SETTING` - USB scanner configuration
- `com.sunmi.scanner.Setting_cmd` - Send commands to serial scanner

## Troubleshooting

### Common Issues

1. **"Platform not supported" error**
   - Solution: This module only works on Android Sunmi devices

2. **"USB scanner disconnected" error**
   - Solution: Check USB connection and ensure scanner is properly plugged in
   - Try: Use a different USB port or cable

3. **"No compatible scanners found" error**
   - Solution: Ensure either built-in serial scanner or supported USB scanner is available
   - Check: USB scanner PID/VID is in supported list

4. **Scanner not responding**
   - Solution: Ensure Sunmi scanner service is running
   - Try: Restart the device or reinstall Sunmi scanner app

5. **Scans not detected (Serial)**
   - Solution: Make sure broadcast output is enabled
   - Check: Scanner hardware is not physically damaged

6. **Scans not detected (USB)**
   - Solution: Check if USB scanner is configured for correct input mode
   - Try: Switch scanner priority or restart initialization

7. **Timeout issues**
   - ON_DEMAND mode: 30-second timeout is fixed for serial scanners
   - CONTINUOUS mode: Use `setScanTimeout()` to adjust
   - USB scanners: Use default configurable timeout

### Debug Tips

- Enable development mode to see console logs
- Check if scanner LED/laser is active during scans
- Test with different QR code types and sizes
- Verify scanner permissions in Android settings
- Use `getAvailableScanners()` to debug scanner detection
- Check `getCurrentScannerType()` to verify active scanner
- Monitor USB connection status for external scanners

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 0.2.0

- **BREAKING CHANGES**: Enhanced API with new scanner management methods
- Added USB barcode scanner support with automatic detection
- Implemented scanner priority system (USB-first by default)
- Added real-time scanner discovery and connection monitoring
- Enhanced error handling with specific error codes for different failure scenarios
- Added KeyEvent processing for USB scanner input
- Improved fallback logic when preferred scanner type is unavailable

### Version 0.1.0

- Initial release
- Dual operation mode support (ON_DEMAND/CONTINUOUS)
- Platform safety checks
- Android 14+ compatibility
- TypeScript support

## Acknowledgments

- Built for Sunmi K2 kiosks and compatible hardware
- Uses Sunmi's official broadcast-based scanner API for Serial scanners
- Implements KeyEvent processing for USB scanner support
- Developed with Expo modules architecture
- Based on Sunmi's official scanner documentation and demo applications
