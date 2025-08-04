# React Native Sunmi Barcode Scanner

A React Native Expo module for integrating with Sunmi barcode scanners on Android devices, specifically designed for Sunmi K2 kiosks and similar hardware.

## Features

- 🔧 **Dual Operation Modes**: Support for both ON_DEMAND and CONTINUOUS scanning modes
- 📱 **Cross-platform Safety**: Platform detection prevents crashes on non-Android devices
- ⚡ **Dual Scanner Support**: Automatic detection and support for both USB and Serial barcode scanners
- 🎯 **Smart Scanner Selection**: Configurable priority system (USB-first by default) with automatic fallback
- 🔊 **Configurable Audio**: Enable/disable scan beep sounds
- ⏱️ **Smart Timeouts**: Mode-aware timeout handling (30s for ON_DEMAND, configurable for CONTINUOUS)
- 🛡️ **Android 14+ Compatible**: Supports latest Android security requirements
- 🎯 **TypeScript Support**: Full TypeScript definitions included
- 🔍 **Scanner Discovery**: Real-time detection of connected USB scanners

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

## Scanner Types

This module automatically detects and supports both USB and Serial barcode scanners:

### USB Barcode Scanners

- External USB barcode scanners connected to Sunmi devices
- Uses KeyEvent processing for scan data capture
- Supports keyboard and broadcast modes
- Automatic detection via PID/VID combinations

### Serial Barcode Scanners

- Built-in serial barcode scanners (most common on Sunmi devices)
- Uses broadcast intents for communication
- Full command support for operation modes
- Hardware trigger control

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

### Methods

#### `initializeScanner(): void`

Initializes the scanner with default settings. Should be called once when the app starts.

#### `scanQRCode(): Promise<string>`

Scans for a QR code and returns the result. Behavior depends on current operation mode:

- **ON_DEMAND**: Triggers a single scan with 30-second timeout
- **CONTINUOUS**: Waits for next scan with configurable timeout

**Throws:**

- `PlatformNotSupportedError`: When called on non-Android platforms
- `COOLDOWN_ACTIVE`: When called too quickly (2-second cooldown)
- `SCAN_TIMEOUT`: When scan times out
- `SCAN_CANCELLED`: When scan is cancelled
- `USB_DISCONNECTED`: When USB scanner is unplugged during operation
- `USB_NOT_FOUND`: When USB_ONLY priority is set but no USB scanner is available
- `SERIAL_NOT_AVAILABLE`: When SERIAL_ONLY priority is set but serial scanner is unavailable
- `NO_SCANNERS_AVAILABLE`: When no compatible scanners are detected
- `SCANNER_BUSY`: When scanner is already in use

#### `cancelScan(): Promise<void>`

Cancels any active scan operation.

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

#### `getAvailableScanners(): Promise<ScannerInfo[]>`

Returns a list of all detected scanners with their connection status and details.

**Returns:**

```typescript
interface ScannerInfo {
  type: "USB" | "SERIAL";
  isConnected: boolean;
  deviceName: string | null;
  pid: number | null; // USB Product ID (USB scanners only)
  vid: number | null; // USB Vendor ID (USB scanners only)
}
```

#### `getCurrentScannerType(): ScannerType`

Returns the currently active scanner type.

**Returns:** `"USB"` | `"SERIAL"` | `"NONE"`

#### `setScanTimeout(timeout: number): void`

Sets the scan timeout in milliseconds (applies to CONTINUOUS mode only).

**Parameters:**

- `timeout`: Timeout in milliseconds (default: 10000)

#### `setBeep(enabled: boolean): void`

Enables or disables the scan beep sound.

**Parameters:**

- `enabled`: Whether to play beep sound on successful scan

### Types

```typescript
type ScannerOperationMode = "ON_DEMAND" | "CONTINUOUS";
type ScannerPriority =
  | "PREFER_USB"
  | "PREFER_SERIAL"
  | "USB_ONLY"
  | "SERIAL_ONLY";
type ScannerType = "USB" | "SERIAL" | "BOTH" | "NONE";

interface ScannerInfo {
  type: ScannerType;
  isConnected: boolean;
  deviceName: string | null;
  pid: number | null;
  vid: number | null;
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
  const [availableScanners, setAvailableScanners] = useState([]);

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

    // Get available scanners
    try {
      const scanners = await ReactNativeSunmiBarcodeScanner.getAvailableScanners();
      setAvailableScanners(scanners);
    } catch (error) {
      console.error("Error getting scanners:", error);
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

  const switchMode = (mode: "ON_DEMAND" | "CONTINUOUS") => {
    ReactNativeSunmiBarcodeScanner.setScannerOperationMode(mode);
    setCurrentMode(mode);
  };

  const switchScannerPriority = (priority: string) => {
    ReactNativeSunmiBarcodeScanner.setScannerPriority(priority);
    updateScannerInfo();
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Current Mode: {currentMode}</Text>
      <Text>Active Scanner: {scannerType}</Text>
      <Text>Available Scanners: {availableScanners.length}</Text>

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

      <View style={{ flexDirection: "row", gap: 10, marginVertical: 10 }}>
        <Button
          title="Prefer USB"
          onPress={() => switchScannerPriority("PREFER_USB")}
        />
        <Button
          title="Prefer Serial"
          onPress={() => switchScannerPriority("PREFER_SERIAL")}
        />
      </View>

      <Button
        title={isScanning ? "Scanning..." : "Scan QR Code"}
        onPress={handleScan}
        disabled={isScanning}
      />
    </View>
  );
}
```

## Platform Support

- ✅ **Android**: Full support on Sunmi devices (K2, etc.)
- ❌ **iOS**: Not supported (throws `PlatformNotSupportedError`)
- ❌ **Web**: Not supported (throws `PlatformNotSupportedError`)

## Hardware Requirements

- Sunmi Android device (e.g., Sunmi K2 kiosk) with one or both of:
  - Built-in serial barcode scanner, OR
  - External USB barcode scanner (supported PID/VID combinations)
- Android API level 24 or higher
- Sunmi scanner service installed and running

### Supported USB Scanners

The module automatically detects USB scanners with these PID/VID combinations:

- 4608,1504
- 9492,1529
- 34,12879
- 193,12879

If you have a different USB scanner, it may still work but won't be automatically detected.

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
