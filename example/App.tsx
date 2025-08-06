import ReactNativeSunmiBarcodeScanner from "react-native-sunmi-barcode-scanner";
import { useState, useEffect } from "react";
import {
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

enum ButtonColors {
  SELECTED = "#28a032ff",
  UNSELECTED = "#718faeff",
}

export default function App() {
  const [inProgress, setInProgress] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<"ON_DEMAND" | "CONTINUOUS">(
    "ON_DEMAND"
  );

  useEffect(() => {
    // Initialize scanner in ON_DEMAND mode when app starts
    ReactNativeSunmiBarcodeScanner.initializeScanner();
    setIsInitialized(true);
    // Get current mode
    const mode = ReactNativeSunmiBarcodeScanner.getScannerOperationMode();
    setCurrentMode(mode);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Sunmi Barcode Scanner SDK</Text>
        <Text style={styles.status}>Current scanner mode: {currentMode}</Text>
        {/* <Group name="Set Scanner Mode">
          <View style={styles.buttonRow}>
            <Button
              disabled={inProgress}
              title="Continuous"
              color={
                currentMode === "CONTINUOUS"
                  ? ButtonColors.SELECTED
                  : ButtonColors.UNSELECTED
              }
              onPress={() => {
                ReactNativeSunmiBarcodeScanner.setScannerOperationMode(
                  "CONTINUOUS"
                );
                setCurrentMode("CONTINUOUS");
                Alert.alert("Scanner Mode", "Switched to Continuous mode");
              }}
            />
            <Button
              disabled={inProgress}
              title="On-Demand"
              color={
                currentMode === "ON_DEMAND"
                  ? ButtonColors.SELECTED
                  : ButtonColors.UNSELECTED
              }
              onPress={() => {
                ReactNativeSunmiBarcodeScanner.setScannerOperationMode(
                  "ON_DEMAND"
                );
                setCurrentMode("ON_DEMAND");
                Alert.alert("Scanner Mode", "Switched to On-Demand mode");
              }}
            />
          </View>
        </Group> */}
        <Group name="Scanner Diagnostics">
          <Text style={styles.groupHeader}>
            Check scanner selection and priority:
          </Text>
          <View style={styles.buttonRow}>
            <Button
              disabled={inProgress}
              title="Current Scanner"
              onPress={() => {
                try {
                  const currentType =
                    ReactNativeSunmiBarcodeScanner.getCurrentScannerType();
                  Alert.alert("Current Scanner", `Active: ${currentType}`);
                } catch (error) {
                  Alert.alert("Error", (error as Error).message);
                }
              }}
            />
            <Button
              disabled={inProgress}
              title="Optimal Scanner"
              onPress={() => {
                try {
                  const optimalType =
                    ReactNativeSunmiBarcodeScanner.getOptimalScannerType();
                  Alert.alert(
                    "Optimal Scanner",
                    `Would select: ${optimalType}\n\nThis shows which scanner would be chosen based on current priority settings.`
                  );
                } catch (error) {
                  Alert.alert("Error", (error as Error).message);
                }
              }}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              disabled={inProgress}
              title="Compare Scanner Types"
              onPress={() => {
                try {
                  const currentType =
                    ReactNativeSunmiBarcodeScanner.getCurrentScannerType();
                  const optimalType =
                    ReactNativeSunmiBarcodeScanner.getOptimalScannerType();
                  const priority =
                    ReactNativeSunmiBarcodeScanner.getScannerPriority();

                  const match =
                    currentType === optimalType ? "✓ Match" : "⚠️ Different";

                  Alert.alert(
                    "Scanner Comparison",
                    `Priority: ${priority}\n\nCurrently Active: ${currentType}\nWould Select: ${optimalType}\n\nStatus: ${match}${currentType !== optimalType ? "\n\n💡 Consider re-initializing the scanner if you want to use the optimal selection." : ""}`
                  );
                } catch (error) {
                  Alert.alert("Error", (error as Error).message);
                }
              }}
            />
          </View>
        </Group>
        <Group name="USB Device Management (Dynamic API)">
          <Text style={styles.groupHeader}>
            Discover and manage compatible USB scanners:
          </Text>
          <View style={styles.buttonRow}>
            <Button
              disabled={inProgress}
              title="List All USB Devices"
              onPress={async () => {
                try {
                  const devices =
                    await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();

                  if (devices.length === 0) {
                    Alert.alert("USB Devices", "No USB devices found");
                    return;
                  }

                  // Format device information for easy reading
                  const deviceInfo = devices
                    .map((device, index) => {
                      const name = device.deviceName || "Unknown Device";
                      const vid = `0x${device.vendorId.toString(16).toUpperCase().padStart(4, "0")}`;
                      const pid = `0x${device.productId.toString(16).toUpperCase().padStart(4, "0")}`;
                      const compatible = device.isCompatible
                        ? "✓ Compatible"
                        : "✗ Not Compatible";

                      return `${index + 1}. ${name}\n   VID: ${vid}, PID: ${pid}\n   Status: ${compatible}`;
                    })
                    .join("\n\n");

                  Alert.alert(
                    `USB Devices Found (${devices.length})`,
                    deviceInfo,
                    [{ text: "OK" }],
                    {
                      cancelable: true,
                      // Make alert scrollable for many devices
                    }
                  );

                  // Also log to console for development
                  if (__DEV__) {
                    console.log("USB Devices:", devices);
                  }
                } catch (error) {
                  Alert.alert("Error", (error as Error).message);
                }
              }}
            />
            <Button
              disabled={inProgress}
              title="List Compatible"
              onPress={() => {
                try {
                  const compatible =
                    ReactNativeSunmiBarcodeScanner.getCompatibleUsbScanners();
                  Alert.alert(
                    "Compatible Scanners",
                    compatible.join("\n") || "None configured"
                  );
                } catch (error) {
                  Alert.alert("Error", (error as Error).message);
                }
              }}
            />
          </View>
          <View style={styles.buttonRow}>
            <Button
              disabled={inProgress}
              title="Add Scanner by VID/PID"
              onPress={() => {
                // Example: Add a custom USB scanner (you can modify these values)
                Alert.prompt(
                  "Add USB Scanner",
                  "Enter VID,PID (e.g., 0x05F9,0x2206):",
                  (input) => {
                    try {
                      const [vidStr, pidStr] = input.split(",");
                      const vid = parseInt(vidStr.trim(), 16);
                      const pid = parseInt(pidStr.trim(), 16);

                      if (isNaN(vid) || isNaN(pid)) {
                        Alert.alert(
                          "Error",
                          "Invalid VID/PID format. Use hex format like 0x05F9,0x2206"
                        );
                        return;
                      }

                      const added =
                        ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(
                          pid,
                          vid
                        );
                      Alert.alert(
                        "Add Scanner",
                        added
                          ? `Added scanner VID: 0x${vid.toString(16).toUpperCase()}, PID: 0x${pid.toString(16).toUpperCase()}`
                          : "Scanner already in compatible list"
                      );
                    } catch (error) {
                      Alert.alert("Error", (error as Error).message);
                    }
                  },
                  "plain-text",
                  "0x05F9,0x2206"
                );
              }}
            />
            <Button
              disabled={inProgress}
              title="Reset to Defaults"
              onPress={() => {
                try {
                  ReactNativeSunmiBarcodeScanner.resetCompatibleUsbScanners();
                  Alert.alert("Reset", "Reset to default Sunmi scanner list");
                } catch (error) {
                  Alert.alert("Error", (error as Error).message);
                }
              }}
            />
          </View>
        </Group>
        <Group name="Scanner API">
          <Button
            disabled={inProgress || !isInitialized}
            title={inProgress ? "Scanning..." : "Start scan QR Code"}
            onPress={async () => {
              setInProgress(true);
              try {
                const result =
                  await ReactNativeSunmiBarcodeScanner.scanQRCode();
                if (__DEV__) {
                  console.log("Scan result:", result);
                }
                Alert.alert("Scan result", result || "No result");
              } catch (error) {
                if (__DEV__) {
                  console.error("Scan error:", error);
                }
                Alert.alert(
                  "Error",
                  (error as Error).message ||
                    "An error occurred while scanning."
                );
              } finally {
                setInProgress(false);
              }
            }}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  status: {
    fontSize: 16,
    margin: 20,
    color: "#666",
    textAlign: "center" as const,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#eee",
    paddingVertical: 20,
  },
  view: {
    flex: 1,
    height: 200,
  },
  buttonRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 5,
  },
};
