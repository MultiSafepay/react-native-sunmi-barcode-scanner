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
export type DataDistributeType =
  | "TYPE_KEYBOARD"
  | "TYPE_BROADCAST"
  | "TYPE_KEYBOARD_AND_BROADCAST";

export interface ScannerInfo {
  type: ScannerType;
  isConnected: boolean;
  deviceName: string | null;
  pid: number | null;
  vid: number | null;
}

export interface UsbDeviceInfo {
  deviceName: string | null;
  vendorId: number;
  productId: number;
  pidVidKey: string;
  deviceClass: number;
  deviceSubclass: number;
  deviceProtocol: number;
  interfaceCount: number;
  isCompatible: boolean;
  hasPermission?: boolean;
  interfaces?: UsbInterfaceInfo[];
}

export interface UsbInterfaceInfo {
  id: number;
  interfaceClass: number;
  interfaceSubclass: number;
  interfaceProtocol: number;
  endpointCount: number;
  name: string;
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
  getOptimalScannerType(): ScannerType;
  setScanTimeout(timeout: number): void;
  setBeep(enabled: boolean): void;
  setToast(enabled: boolean): void;
  getToast(): boolean;
  setUsbScannerMode(mode: number): void;
  setDataDistributeType(type: DataDistributeType): void;
  getAllUsbDevices(): Promise<UsbDeviceInfo[]>;
  addCompatibleUsbScanner(productId: number, vendorId: number): boolean;
  removeCompatibleUsbScanner(productId: number, vendorId: number): boolean;
  getCompatibleUsbScanners(): string[];
  resetCompatibleUsbScanners(): void;
  requestUsbPermission(vendorId: number, productId: number): boolean;
  testUsbScannerModes(vendorId: number, productId: number): void;
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

  getOptimalScannerType(): ScannerType {
    checkPlatform();
    return nativeModule!.getOptimalScannerType();
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

  setUsbScannerMode(mode: number): void {
    checkPlatform();
    nativeModule!.setUsbScannerMode(mode);
  },

  setDataDistributeType(type: DataDistributeType): void {
    checkPlatform();
    nativeModule!.setDataDistributeType(type);
  },

  async getAllUsbDevices(): Promise<UsbDeviceInfo[]> {
    checkPlatform();
    return nativeModule!.getAllUsbDevices();
  },

  addCompatibleUsbScanner(productId: number, vendorId: number): boolean {
    checkPlatform();
    return nativeModule!.addCompatibleUsbScanner(productId, vendorId);
  },

  removeCompatibleUsbScanner(productId: number, vendorId: number): boolean {
    checkPlatform();
    return nativeModule!.removeCompatibleUsbScanner(productId, vendorId);
  },

  getCompatibleUsbScanners(): string[] {
    checkPlatform();
    return nativeModule!.getCompatibleUsbScanners();
  },

  resetCompatibleUsbScanners(): void {
    checkPlatform();
    nativeModule!.resetCompatibleUsbScanners();
  },

  requestUsbPermission(vendorId: number, productId: number): boolean {
    checkPlatform();
    return nativeModule!.requestUsbPermission(vendorId, productId);
  },

  testUsbScannerModes(vendorId: number, productId: number): void {
    checkPlatform();
    nativeModule!.testUsbScannerModes(vendorId, productId);
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
