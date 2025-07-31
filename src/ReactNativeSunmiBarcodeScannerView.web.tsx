import * as React from 'react';

import { ReactNativeSunmiBarcodeScannerViewProps } from './ReactNativeSunmiBarcodeScanner.types';

export default function ReactNativeSunmiBarcodeScannerView(props: ReactNativeSunmiBarcodeScannerViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
