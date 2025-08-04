package expo.modules.sunmibarcodescanner

import android.app.Activity
import android.view.KeyEvent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import java.net.URL

class ReactNativeSunmiBarcodeScannerModule : Module() {

  private var barcodeScanner = SunmiBarcodeScanner()
  private val context get() = requireNotNull(appContext.reactContext)

  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ReactNativeSunmiBarcodeScanner')` in JavaScript.
    Name("ReactNativeSunmiBarcodeScanner")

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(ReactNativeSunmiBarcodeScannerView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: ReactNativeSunmiBarcodeScannerView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      // Defines an event that the view can send to JavaScript.
      Events("onLoad")
    }

    // ----------------------------------------
    // Sunmi Barcode Scanner SDK public methods
    // ----------------------------------------

    Function("initializeScanner") {
      barcodeScanner.initializeScanner(context)
    }

    Function("setScannerOperationMode") { mode: String ->
      val operationMode = ScannerOperationMode.valueOf(mode)
      barcodeScanner.setScannerOperationMode(context, operationMode)
    }

    Function("getScannerOperationMode") {
      return@Function barcodeScanner.getScannerOperationMode().modeName
    }

    Function("setScannerPriority") { priority: String ->
      val scannerPriority = ScannerPriority.valueOf(priority)
      barcodeScanner.setScannerPriority(context, scannerPriority)
    }

    Function("getScannerPriority") {
      return@Function barcodeScanner.getScannerPriority().priorityName
    }

    AsyncFunction("getAvailableScanners") { promise: Promise ->
      try {
        val scanners = barcodeScanner.getAvailableScanners(context)
        val scannersArray = scanners.map { scanner ->
          mapOf(
            "type" to scanner.type.typeName,
            "isConnected" to scanner.isConnected,
            "deviceName" to scanner.deviceName,
            "pid" to scanner.pid,
            "vid" to scanner.vid
          )
        }
        promise.resolve(scannersArray)
      } catch (e: Exception) {
        promise.reject("SCANNER_DETECTION_ERROR", e.message, e)
      }
    }

    Function("getCurrentScannerType") {
      return@Function barcodeScanner.getCurrentScannerType().typeName
    }

    Function("setScanTimeout") { timeout: Long ->
      barcodeScanner.setScanTimeout(timeout)
    }

    Function("setBeep") { enabled: Boolean ->
      barcodeScanner.setBeep(enabled)
    }

    Function("setToast") { enabled: Boolean ->
      barcodeScanner.setToast(enabled)
    }

    Function("getToast") {
      barcodeScanner.getToast()
    }

    AsyncFunction("scanQRCode")  { promise: Promise ->
      barcodeScanner.scanQRCode(context, promise)
    }

    AsyncFunction("cancelScan")  { promise: Promise ->
      barcodeScanner.cancelScan(context, promise)
    }

    // Cleanup when module is destroyed
    OnDestroy {
      barcodeScanner.destroy()
    }
  }
}
