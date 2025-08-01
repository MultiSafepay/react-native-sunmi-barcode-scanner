# React Native Sunmi Barcode Scanner

A React Native Expo module for integrating with Sunmi barcode scanners on Android devices, specifically designed for Sunmi K2 kiosks and similar hardware.

## Features

- 🔧 **Dual Operation Modes**: Support for both ON_DEMAND and CONTINUOUS scanning modes
- 📱 **Cross-platform Safety**: Platform detection prevents crashes on non-Android devices
- ⚡ **Broadcast-based Integration**: Uses Sunmi's official broadcast API for reliable communication
- 🔊 **Configurable Audio**: Enable/disable scan beep sounds
- ⏱️ **Smart Timeouts**: Mode-aware timeout handling (30s for ON_DEMAND, configurable for CONTINUOUS)
- 🛡️ **Android 14+ Compatible**: Supports latest Android security requirements
- 🎯 **TypeScript Support**: Full TypeScript definitions included

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

#### `cancelScan(): Promise<void>`

Cancels any active scan operation.

#### `setScannerOperationMode(mode: ScannerOperationMode): void`

Sets the scanner operation mode.

**Parameters:**

- `mode`: `"ON_DEMAND"` | `"CONTINUOUS"`

#### `getScannerOperationMode(): ScannerOperationMode`

Returns the current scanner operation mode.

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
```

## Complete Example

```typescript
import React, { useState, useEffect } from "react";
import { Alert, Button, View, Text } from "react-native";
import ReactNativeSunmiBarcodeScanner from "react-native-sunmi-barcode-scanner";

export default function App() {
  const [currentMode, setCurrentMode] = useState<"ON_DEMAND" | "CONTINUOUS">("ON_DEMAND");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    // Initialize scanner when app starts
    ReactNativeSunmiBarcodeScanner.initializeScanner();

    // Get current mode
    const mode = ReactNativeSunmiBarcodeScanner.getScannerOperationMode();
    setCurrentMode(mode);
  }, []);

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

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Current Mode: {currentMode}</Text>

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

- Sunmi Android device with built-in barcode scanner (e.g., Sunmi K2 kiosk)
- Android API level 24 or higher
- Sunmi scanner service installed and running

## Technical Details

### Sunmi Commands Used

- `@SCNMOD0` - Trigger mode (ON_DEMAND)
- `@SCNMOD2` - Auto sense mode (CONTINUOUS)
- `#SCNTRG1` - Trigger single scan
- `#SCNTRG0` - Stop scanning
- `@ORTSET30000` - 30 second timeout for ON_DEMAND
- `@ORTSET800` - 800ms timeout for CONTINUOUS
- `@RRDDUR1000` - 1000ms same code interval
- `@GRBENA1` - Enable beep sound

### Broadcast Intents

- `com.sunmi.scanner.ACTION_DATA_CODE_RECEIVED` - Receives scan results
- `com.sunmi.scanner.ACTION_SCANNER_SERIAL_SETTING` - Scanner configuration
- `com.sunmi.scanner.Setting_cmd` - Send commands to scanner

## Troubleshooting

### Common Issues

1. **"Platform not supported" error**
   - Solution: This module only works on Android Sunmi devices

2. **Scanner not responding**
   - Solution: Ensure Sunmi scanner service is running
   - Try: Restart the device or reinstall Sunmi scanner app

3. **Scans not detected**
   - Solution: Make sure broadcast output is enabled
   - Check: Scanner hardware is not physically damaged

4. **Timeout issues**
   - ON_DEMAND mode: 30-second timeout is fixed
   - CONTINUOUS mode: Use `setScanTimeout()` to adjust

### Debug Tips

- Enable development mode to see console logs
- Check if scanner LED/laser is active during scans
- Test with different QR code types and sizes
- Verify scanner permissions in Android settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 0.1.0

- Initial release
- Dual operation mode support (ON_DEMAND/CONTINUOUS)
- Platform safety checks
- Android 14+ compatibility
- TypeScript support

## Acknowledgments

- Built for Sunmi K2 kiosks and compatible hardware
- Uses Sunmi's official broadcast-based scanner API
- Developed with Expo modules architecture
