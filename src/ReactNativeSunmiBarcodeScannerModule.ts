import { NativeModule, requireNativeModule } from 'expo';

import { ReactNativeSunmiBarcodeScannerModuleEvents } from './ReactNativeSunmiBarcodeScanner.types';

declare class ReactNativeSunmiBarcodeScannerModule extends NativeModule<ReactNativeSunmiBarcodeScannerModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ReactNativeSunmiBarcodeScannerModule>('ReactNativeSunmiBarcodeScanner');
