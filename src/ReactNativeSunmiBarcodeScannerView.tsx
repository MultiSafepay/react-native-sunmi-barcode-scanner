import { requireNativeView } from 'expo';
import * as React from 'react';

import { ReactNativeSunmiBarcodeScannerViewProps } from './ReactNativeSunmiBarcodeScanner.types';

const NativeView: React.ComponentType<ReactNativeSunmiBarcodeScannerViewProps> =
  requireNativeView('ReactNativeSunmiBarcodeScanner');

export default function ReactNativeSunmiBarcodeScannerView(props: ReactNativeSunmiBarcodeScannerViewProps) {
  return <NativeView {...props} />;
}
