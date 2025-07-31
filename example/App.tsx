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
        <Group name="Set Scanner Mode">
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
    justifyContent: "space-around" as const,
    gap: 10,
  },
};
