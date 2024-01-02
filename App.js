import axios from "axios";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import {
  Button,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Dropdown from "./components/Dropdown";
import { DataTable } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getRecordsByScript,
  monitorAndUpdateState,
  registerForPushNotificationsAsync,
  some,
} from "./helper";
// import { Notifications } from "react-native-notifications";

const scripts = [
  { key: 0, value: "NIFTY" },
  { key: 1, value: "BANKNIFTY" },
];

const BACKGROUND_FETCH_TASK = "background-fetch";

// // 1. Define the task by providing a name and the function that should be executed
// // Note: This needs to be called in the global scope (e.g outside of your React components)
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  const now = Date.now();
  console.log(
    `Got background fetch call at date: ${new Date(now).toISOString()}`
  );

  let res, res2;
  res = await some("BANKNIFTY", (_res) => {
  });
  res2= await some("NIFTY", (_res2) => { 
  })
  if (res && res2) {
    let tableState = await AsyncStorage.getItem("tableState");
    if (tableState && tableState!=undefined) {
      let _ts = JSON.parse(tableState);
        monitorAndUpdateState(
        _ts,
        res2?.records,
        res?.records,
        (newOOCTrade) =>
          {}
      )
    }
  }

  // Be sure to return the successful result type!
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
async function registerBackgroundFetchAsync() {
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 1, // 1 second
    stopOnTerminate: false, // android only,
    startOnBoot: true, // android only
  });
}

// 3. (Optional) Unregister tasks by specifying the task name
// This will cancel any future background fetch calls that match the given name
// Note: This does NOT need to be in the global scope and CAN be used in your React components!
async function unregisterBackgroundFetchAsync() {
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}

export default function App() {
  // BANKNIFTY
  const [res, setRes] = useState();
  // NIFTY
  const [res2, setRes2] = useState();

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    // ()=>{
    //   unregisterBackgroundFetchAsync();
    // }
  }, []);
  const [refreshApi, setRefreshApi] = useState(0);
  const [intervalId, setIntervalId] = useState(0);
  const [ExpiryUG, setExpiryUG] = useState("");

  const [script, setScript] = useState();

  const [possibleExpiry, setPossibleExpiry] = useState([]);
  const [possibleStrikePrices, setPossibleStrikePrices] = useState([]);

  const [ceStrikePriceSell, setCeStrikePriceSell] = useState();
  const [ceStrikePriceBuy, setCeStrikePriceBuy] = useState();

  const [peStrikePriceSell, setPeStrikePriceSell] = useState();
  const [peStrikePriceBuy, setPeStrikePriceBuy] = useState();

  // User Generated
  const [peStrikePriceSellCost, setPeStrikePriceSellCost] = useState();
  const [peStrikePriceBuyCost, setPeStrikePriceBuyCost] = useState();

  const [ceStrikePriceSellCost, setCeStrikePriceSellCost] = useState();
  const [ceStrikePriceBuyCost, setCeStrikePriceBuyCost] = useState();

  const [tableState, setTableState] = useState([]);

  const [expoPushToken, setExpoPushToken] = useState("");

  const [outOfControlTrades, setOutOfControlTrades] = useState([]);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) =>
      setExpoPushToken(token)
    );

    // notificationListener.current =
    //   Notifications.addNotificationReceivedListener((notification) => {
    //     setNotification(notification);
    //   });

    // responseListener.current =
    //   Notifications.addNotificationResponseReceivedListener((response) => {
    //     console.log(response);
    //   });

    // checkStatusAsync().then(()=>{
    //   registerBackgroundFetchAsync();
    // });
    // return () => {
    //   Notifications.removeNotificationSubscription(
    //     notificationListener.current
    //   );
    //   Notifications.removeNotificationSubscription(responseListener.current);
    // };
  }, []);

  useEffect(() => {
    registerBackgroundFetchAsync();
    (async () => {
      let localTableState = await AsyncStorage.getItem("tableState");
      setTableState(JSON.parse(localTableState));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (tableState)
        await AsyncStorage.setItem("tableState", JSON.stringify(tableState));
    })();
  }, [tableState]);

  // const [isRegistered, setIsRegistered] = useState(false);
  // const [status, setStatus] = useState(null);

  // const checkStatusAsync = async () => {
  //   const status = await BackgroundFetch.getStatusAsync();
  //   const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  //   setStatus(status);
  //   setIsRegistered(isRegistered);
  // };

  useEffect(() => {
    setInterval(() => some("BANKNIFTY", setRes), 10000);
    setInterval(() => some("NIFTY", setRes2), 10000);
  }, []);

  useEffect(() => {
    some("BANKNIFTY", setRes);
    some("NIFTY", setRes2);
  }, [refreshApi]);

  let data = useMemo(() => {
    return [
      { key: 0, value: "NIFTY" },
      { key: 1, value: "BANKNIFTY" },
    ];
  }, []);
  useEffect(() => {
    // debugger
    if (res?.records && res2?.records) {
      let _records = getRecordsByScript(script, res2.records, res.records);
      setPossibleExpiry(
        _records.expiryDates?.map((val, index) => ({
          value: val,
          key: index,
        }))
      );
      setPossibleStrikePrices(
        _records.strikePrices?.map((val, index) => ({
          value: val.toString(),
          key: index,
        }))
      );

      setTableState(
        monitorAndUpdateState(
          tableState,
          res2?.records,
          res?.records,
          (newOOCTrade) => {
            setOutOfControlTrades((ps) => {
              return [...ps, newOOCTrade];
            });
          }
        )
      );
    }
  }, [res]);

  return (
    <View style={styles.container}>
      <Text
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        Combine Alerts
      </Text>
      <Dropdown
        label={"Enter script (NIFTY or BANKNIFTY)"}
        styles={styles}
        data={data}
        _value={script}
        onChange={(value) => {
          setScript(value);
          setRefreshApi(refreshApi + 1);
        }}
      ></Dropdown>
      <Dropdown
        label={"Enter Expiry"}
        styles={styles}
        _value={ExpiryUG}
        data={possibleExpiry}
        onChange={(value) => {
          // filterExpiry(value);
          setExpiryUG(value);
        }}
      ></Dropdown>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          // backgroundColor: "red",
          width: "95%",
          gap: 10,
        }}
      >
        <View style={{ width: "50%" }}>
          <Text>CE Sell</Text>
          <Dropdown
            label={"Enter CE strike price"}
            styles={styles}
            _value={ceStrikePriceSell}
            data={possibleStrikePrices}
            onChange={(value) => {
              // filterExpiry(value);
              setCeStrikePriceSell(value);
            }}
          ></Dropdown>
          <TextInput
            style={styles.fieldStyleGeneral}
            value={ceStrikePriceSellCost}
            placeholder="Enter your sell price for CE"
            onChangeText={(e) => setCeStrikePriceSellCost(e)}
          ></TextInput>
          <Text>CE BUY</Text>
          <Dropdown
            label={"Enter CE strike price"}
            styles={styles}
            data={possibleStrikePrices}
            _value={ceStrikePriceBuy}
            onChange={(value) => {
              // filterExpiry(value);
              setCeStrikePriceBuy(value);
            }}
          ></Dropdown>
          <TextInput
            style={styles.fieldStyleGeneral}
            value={ceStrikePriceBuyCost}
            placeholder="Enter your buy price for CE"
            onChangeText={(e) => setCeStrikePriceBuyCost(e)}
          ></TextInput>
        </View>
        <View style={{ width: "50%" }}>
          <Text>PE Sell</Text>
          <Dropdown
            label={"Enter PE strike price"}
            styles={styles}
            data={possibleStrikePrices}
            _value={peStrikePriceSell}
            onChange={(value) => {
              // filterExpiry(value);
              setPeStrikePriceSell(value);
            }}
          ></Dropdown>
          <TextInput
            style={styles.fieldStyleGeneral}
            value={peStrikePriceSellCost}
            placeholder="Enter your sell price for PE"
            onChangeText={(e) => setPeStrikePriceSellCost(e)}
          ></TextInput>
          <Text>PE BUY</Text>
          <Dropdown
            label={"Enter PE strike price"}
            styles={styles}
            data={possibleStrikePrices}
            _value={peStrikePriceBuy}
            onChange={(value) => {
              // filterExpiry(value);
              setPeStrikePriceBuy(value);
            }}
          ></Dropdown>
          <TextInput
            style={styles.fieldStyleGeneral}
            value={peStrikePriceBuyCost}
            placeholder="Enter your buy price for PE"
            onChangeText={(e) => setPeStrikePriceBuyCost(e)}
          ></TextInput>
        </View>
      </View>
      <View style={{ width: "96%" }}>
        <Button
          title="Add Trade"
          onPress={() => {
            Keyboard.dismiss();
            let newObj = {
              id: tableState.length + 1,
              script: script,
              expiry: ExpiryUG,
              ceStrikePriceSell: ceStrikePriceSell,
              peStrikePriceSell: peStrikePriceSell,
              ceStrikePriceBuy: ceStrikePriceBuy,
              peStrikePriceBuy: peStrikePriceBuy,
              ceStrikePriceBuyCost: ceStrikePriceBuyCost,
              ceStrikePriceSellCost: ceStrikePriceSellCost,
              peStrikePriceBuyCost: peStrikePriceBuyCost,
              peStrikePriceSellCost: peStrikePriceSellCost,
            };
            setTableState((ps)=>([...ps, newObj]));
            setRefreshApi(refreshApi + 1);
            setScript('');
            setExpiryUG('');
            setCeStrikePriceBuy('');
            setCeStrikePriceBuyCost('');
            setPeStrikePriceBuy('');
            setPeStrikePriceBuyCost('')
            setCeStrikePriceSell('');
            setCeStrikePriceSellCost('');
            setPeStrikePriceSell('');
            setPeStrikePriceSellCost('');
          }}
        ></Button>
      </View>
      <Text
        style={{
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          fontSize: 20,
          margin: 20,
          fontWeight: 700,
        }}
      >
        Currently Monitored
      </Text>
      <ScrollView
        scrollEnabled
        style={{
          borderRadius: 5,
          borderColor: "black",
          borderStyle: "solid",
          shadowColor: "#000",
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.8,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Script</DataTable.Title>
            <DataTable.Title>CE Sell</DataTable.Title>
            <DataTable.Title>PE Sell</DataTable.Title>
            <DataTable.Title>CE Buy</DataTable.Title>
            <DataTable.Title>PE Buy</DataTable.Title>
          </DataTable.Header>
          <ScrollView style={{ maxHeight: 250 }}>
            {tableState?.map((row) => (
              <TouchableOpacity
                onPress={() =>
                 {
                  setOutOfControlTrades((ps)=>ps.filter((val) => val !== row.id))
                  setTableState(tableState.filter((val) => val.id !== row.id))
                }
                }
                key={Math.random()}
              >
                <DataTable.Row>
                  {Object.keys(row)
                    ?.filter(
                      (cellKey) =>
                        !cellKey.includes("Cost") &&
                        !cellKey.includes("expiry") &&
                        !cellKey.includes("id") &&
                        !cellKey.includes("Monitored")
                    )
                    ?.map((cellKey) => (
                      <DataTable.Cell key={Math.random()}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: outOfControlTrades?.includes(row.id)
                                ? "red"
                                : "black",
                            }}
                          >
                            {row[cellKey]}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#7383A7" }}>
                            {cellKey.includes("Sell") ||
                            cellKey.includes("Buy") ? (
                              <Text>
                                {row[cellKey + "Cost"]} CP -{" "}
                                {row[cellKey + "Monitored"]}
                              </Text>
                            ) : cellKey.includes("script") ? (
                              row["expiry"]
                            ) : (
                              ""
                            )}
                          </Text>
                        </View>
                      </DataTable.Cell>
                    ))}
                </DataTable.Row>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </DataTable>
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 75,
    paddingLeft: 25,
    paddingRight: 15,
    width: "100%",
    backgroundColor: "#F0F7F5",
    position: "absolute",
  },
  fieldStyleGeneral: {
    height: 40,
    borderColor: "gray",
    borderRadius: 5,
    padding: 5,
    borderWidth: 1,
    width: "95%",
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
  },
});
