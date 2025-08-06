import ReactNativeSunmiBarcodeScanner from "react-native-sunmi-barcode-scanner";
import { useState, useEffect } from "react";
import {
  Alert,
  Button,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
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

  // State for VID/PID input dialog
  const [showVidPidDialog, setShowVidPidDialog] = useState(false);
  const [vidInput, setVidInput] = useState("");
  const [pidInput, setPidInput] = useState("");

  // State for USB device interfaces
  const [usbDevices, setUsbDevices] = useState<any[]>([]);
  const [showInterfaces, setShowInterfaces] = useState(false);

  const handleAddScanner = () => {
    try {
      // Parse VID and PID (support both hex and decimal)
      let vid: number;
      let pid: number;

      if (vidInput.startsWith("0x") || vidInput.startsWith("0X")) {
        vid = parseInt(vidInput, 16);
      } else {
        vid = parseInt(vidInput, 10);
      }

      if (pidInput.startsWith("0x") || pidInput.startsWith("0X")) {
        pid = parseInt(pidInput, 16);
      } else {
        pid = parseInt(pidInput, 10);
      }

      if (isNaN(vid) || isNaN(pid) || vid < 0 || pid < 0) {
        Alert.alert(
          "Error",
          "Invalid VID/PID format. Please enter valid numbers (decimal or hex with 0x prefix)"
        );
        return;
      }

      const added = ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(
        pid,
        vid
      );

      Alert.alert(
        "Add Scanner",
        added
          ? `Added scanner VID: 0x${vid.toString(16).toUpperCase()}, PID: 0x${pid.toString(16).toUpperCase()}`
          : "Scanner already in compatible list"
      );

      // Reset dialog
      setShowVidPidDialog(false);
      setVidInput("");
      setPidInput("");
    } catch (error) {
      Alert.alert("Error", (error as Error).message);
    }
  };

  const loadUsbDevices = async () => {
    try {
      const devices = await ReactNativeSunmiBarcodeScanner.getAllUsbDevices();
      setUsbDevices(devices);
      setShowInterfaces(true);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to load USB devices: " + (error as Error).message
      );
    }
  };

  useEffect(() => {
    ReactNativeSunmiBarcodeScanner.addCompatibleUsbScanner(16389, 1529); // Datalogic 3450VSi

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
        <View>
          <Text style={styles.status}>Current scanner mode: {currentMode}</Text>
          <Text style={styles.status}>
            {`Current scanner: ${ReactNativeSunmiBarcodeScanner.getCurrentScannerType()}`}
          </Text>
        </View>
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
                setVidInput("");
                setPidInput("");
                setShowVidPidDialog(true);
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
        <Group name="USB Device Interfaces (Troubleshooting)">
          <Text style={styles.groupHeader}>
            Analyze USB device interfaces for troubleshooting:
          </Text>
          <View style={styles.buttonRow}>
            <Button title="Load USB Devices" onPress={loadUsbDevices} />
            <Button
              title={showInterfaces ? "Hide Interfaces" : "Show Interfaces"}
              onPress={() => setShowInterfaces(!showInterfaces)}
              disabled={usbDevices.length === 0}
            />
          </View>
          {showInterfaces && usbDevices.length > 0 && (
            <ScrollView style={styles.interfaceList}>
              {usbDevices.map((device, index) => (
                <View key={index} style={styles.deviceInfo}>
                  <Text style={styles.deviceHeader}>
                    📱 {device.deviceName || "Unknown Device"}
                  </Text>
                  <Text style={styles.deviceDetail}>
                    VID: 0x
                    {device.vendorId
                      .toString(16)
                      .toUpperCase()
                      .padStart(4, "0")}{" "}
                    ({device.vendorId})
                  </Text>
                  <Text style={styles.deviceDetail}>
                    PID: 0x
                    {device.productId
                      .toString(16)
                      .toUpperCase()
                      .padStart(4, "0")}{" "}
                    ({device.productId})
                  </Text>
                  <Text style={styles.deviceDetail}>
                    Class: {device.deviceClass} | Subclass:{" "}
                    {device.deviceSubclass} | Protocol: {device.deviceProtocol}
                  </Text>
                  <Text style={styles.deviceDetail}>
                    Compatible: {device.isCompatible ? "✅ Yes" : "❌ No"} |
                    Permission: {device.hasPermission ? "✅ Yes" : "❌ No"}
                  </Text>

                  {device.interfaces && device.interfaces.length > 0 && (
                    <View style={styles.interfaceContainer}>
                      <Text style={styles.interfaceHeader}>
                        🔌 Interfaces ({device.interfaces.length}):
                      </Text>
                      {device.interfaces.map(
                        (iface: any, ifaceIndex: number) => (
                          <View key={ifaceIndex} style={styles.interfaceItem}>
                            <Text style={styles.interfaceText}>
                              Interface {iface.id}: Class {iface.interfaceClass}
                              (Sub: {iface.interfaceSubclass}, Proto:{" "}
                              {iface.interfaceProtocol})
                            </Text>
                            <Text style={styles.interfaceText}>
                              Endpoints: {iface.endpointCount} | Name:{" "}
                              {iface.name || "N/A"}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                  {device.isCompatible && !device.hasPermission && (
                    <View style={styles.buttonRow}>
                      <Button
                        title="Request Permission"
                        onPress={() => {
                          const result =
                            ReactNativeSunmiBarcodeScanner.requestUsbPermission(
                              device.vendorId,
                              device.productId
                            );
                          Alert.alert(
                            "USB Permission",
                            result
                              ? "Permission already granted"
                              : "Permission request sent"
                          );
                        }}
                      />
                      <Button
                        title="Test Modes"
                        onPress={() => {
                          ReactNativeSunmiBarcodeScanner.testUsbScannerModes(
                            device.vendorId,
                            device.productId
                          );
                          Alert.alert(
                            "Testing",
                            "Testing all USB modes for this device. Check logs for details."
                          );
                        }}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
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

      {/* VID/PID Input Dialog */}
      <Modal
        visible={showVidPidDialog}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVidPidDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add USB Scanner</Text>
            <Text style={styles.modalSubtitle}>
              Enter VID and PID (decimal or hex with 0x prefix)
            </Text>

            <Text style={styles.inputLabel}>VID (Vendor ID):</Text>
            <TextInput
              style={styles.textInput}
              value={vidInput}
              onChangeText={setVidInput}
              placeholder="e.g., 0x05F9 or 1529"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>PID (Product ID):</Text>
            <TextInput
              style={styles.textInput}
              value={pidInput}
              onChangeText={setPidInput}
              placeholder="e.g., 0x2206 or 8710"
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtonRow}>
              <Button
                title="Cancel"
                color="#999"
                onPress={() => {
                  setShowVidPidDialog(false);
                  setVidInput("");
                  setPidInput("");
                }}
              />
              <Button
                title="Add Scanner"
                onPress={handleAddScanner}
                disabled={!vidInput.trim() || !pidInput.trim()}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold" as const,
    marginBottom: 10,
    textAlign: "center" as const,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center" as const,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold" as const,
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  modalButtonRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    marginTop: 20,
  },
  interfaceList: {
    maxHeight: 400,
    marginTop: 10,
  },
  deviceInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  deviceHeader: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: "#495057",
    marginBottom: 8,
  },
  deviceDetail: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
    fontFamily: "monospace" as const,
  },
  interfaceContainer: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#007bff",
  },
  interfaceHeader: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: "#007bff",
    marginBottom: 6,
  },
  interfaceItem: {
    backgroundColor: "#e7f3ff",
    padding: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  interfaceText: {
    fontSize: 12,
    color: "#495057",
    fontFamily: "monospace" as const,
  },
};
