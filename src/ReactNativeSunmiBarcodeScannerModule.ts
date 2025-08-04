import { NativeModule, requireNativeModule } from "expo";
import { Platform } from "react-native";

import { ReactNativeSunmiBarcodeScannerModuleEvents } from "./ReactNativeSunmiBarcodeScanner.types";

export type ScannerOperationMode = "ON_DEMAND" | "CONTINUOUS";
export type ScannerPriority =
  | "PREFER_USB"
  | "PREFER_SERIAL"
  | "USB_ONLY"
  | "SERIAL_ONLY";
export type ScannerType = "USB" | "SERIAL" | "BOTH" | "NONE";

export interface ScannerInfo {
  type: ScannerType;
  isConnected: boolean;
  deviceName: string | null;
  pid: number | null;
  vid: number | null;
}

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
  setScannerPriority(priority: ScannerPriority): void;
  getScannerPriority(): ScannerPriority;
  getAvailableScanners(): Promise<ScannerInfo[]>;
  getCurrentScannerType(): ScannerType;
  setScanTimeout(timeout: number): void;
  setBeep(enabled: boolean): void;
  setToast(enabled: boolean): void;
  getToast(): boolean;
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

  setScannerPriority(priority: ScannerPriority): void {
    checkPlatform();
    nativeModule!.setScannerPriority(priority);
  },

  getScannerPriority(): ScannerPriority {
    checkPlatform();
    return nativeModule!.getScannerPriority();
  },

  async getAvailableScanners(): Promise<ScannerInfo[]> {
    checkPlatform();
    return nativeModule!.getAvailableScanners();
  },

  getCurrentScannerType(): ScannerType {
    checkPlatform();
    return nativeModule!.getCurrentScannerType();
  },

  setScanTimeout(timeout: number): void {
    checkPlatform();
    nativeModule!.setScanTimeout(timeout);
  },

  setBeep(enabled: boolean): void {
    checkPlatform();
    nativeModule!.setBeep(enabled);
  },

  setToast(enabled: boolean): void {
    checkPlatform();
    nativeModule!.setToast(enabled);
  },

  getToast(): boolean {
    checkPlatform();
    return nativeModule!.getToast();
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
