import { NativeModule, requireNativeModule } from "expo";
import { Platform } from "react-native";

import { ReactNativeSunmiBarcodeScannerModuleEvents } from "./ReactNativeSunmiBarcodeScanner.types";

export type ScannerOperationMode = "ON_DEMAND" | "CONTINUOUS";

class PlatformNotSupportedError extends Error {
  constructor() {
    super(
      "Platform not supported. Sunmi barcode scanner is only available on Android."
    );
    this.name = "PlatformNotSupportedError";
  }
}

const checkPlatform = () => {
  if (Platform.OS !== "android") {
    throw new PlatformNotSupportedError();
  }
};

declare class ReactNativeSunmiBarcodeScannerModuleNative extends NativeModule<ReactNativeSunmiBarcodeScannerModuleEvents> {
  initializeScanner(): void;
  setScannerOperationMode(mode: ScannerOperationMode): void;
  getScannerOperationMode(): ScannerOperationMode;
  setScanTimeout(timeout: number): void;
  setBeep(enabled: boolean): void;
  scanQRCode: () => Promise<string>;
  cancelScan: () => Promise<void>;
}

const nativeModule =
  Platform.OS === "android"
    ? requireNativeModule<ReactNativeSunmiBarcodeScannerModuleNative>(
        "ReactNativeSunmiBarcodeScanner"
      )
    : null;

// Platform-aware wrapper
const ReactNativeSunmiBarcodeScannerModule = {
  initializeScanner(): void {
    checkPlatform();
    nativeModule!.initializeScanner();
  },

  setScannerOperationMode(mode: ScannerOperationMode): void {
    checkPlatform();
    nativeModule!.setScannerOperationMode(mode);
  },

  getScannerOperationMode(): ScannerOperationMode {
    checkPlatform();
    return nativeModule!.getScannerOperationMode();
  },

  setScanTimeout(timeout: number): void {
    checkPlatform();
    nativeModule!.setScanTimeout(timeout);
  },

  setBeep(enabled: boolean): void {
    checkPlatform();
    nativeModule!.setBeep(enabled);
  },

  async scanQRCode(): Promise<string> {
    checkPlatform();
    return nativeModule!.scanQRCode();
  },

  async cancelScan(): Promise<void> {
    checkPlatform();
    return nativeModule!.cancelScan();
  },
};

export default ReactNativeSunmiBarcodeScannerModule;
