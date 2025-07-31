import { registerWebModule, NativeModule } from 'expo';

import { ReactNativeSunmiBarcodeScannerModuleEvents } from './ReactNativeSunmiBarcodeScanner.types';

class ReactNativeSunmiBarcodeScannerModule extends NativeModule<ReactNativeSunmiBarcodeScannerModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ReactNativeSunmiBarcodeScannerModule, 'ReactNativeSunmiBarcodeScannerModule');
