// Reexport the native module. On web, it will be resolved to ReactNativeSunmiBarcodeScannerModule.web.ts
// and on native platforms to ReactNativeSunmiBarcodeScannerModule.ts
export { default } from "./ReactNativeSunmiBarcodeScannerModule";
export { default as ReactNativeSunmiBarcodeScannerView } from "./ReactNativeSunmiBarcodeScannerView";
export * from "./ReactNativeSunmiBarcodeScanner.types";
export type {
  ScannerOperationMode,
  ScannerPriority,
  ScannerType,
  ScannerInfo,
  DataDistributeType,
  UsbDeviceInfo,
} from "./ReactNativeSunmiBarcodeScannerModule";
