import * as Device from "expo-device";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import axios from "axios";

export const getRecordsByScript = (script, res2Records, resRecords) => {
  console.log(script)
  return script === "BANKNIFTY" ? resRecords : res2Records;
};

export const monitorAndUpdateState = (
  localTableState,
  res2Records,
  resRecords,
  setOutOfControlTrades
) => {
  localTableState = localTableState?.map((row) => ({
    ...row,
    ceStrikePriceBuyMonitored: getPriceByStrikePriceExpiryUg(
      getRecordsByScript(row["script"], res2Records, resRecords),
      row["expiry"],
      row["ceStrikePriceBuy"],
      'CE'
    ),
    ceStrikePriceSellMonitored: getPriceByStrikePriceExpiryUg(
      getRecordsByScript(row["script"], res2Records, resRecords),
      row["expiry"],
      row["ceStrikePriceSell"],
      'CE'
    ),
    peStrikePriceBuyMonitored: getPriceByStrikePriceExpiryUg(
      getRecordsByScript(row["script"], res2Records, resRecords),
      row["expiry"],
      row["peStrikePriceBuy"],
      'PE'
    ),
    peStrikePriceSellMonitored: getPriceByStrikePriceExpiryUg(
      getRecordsByScript(row["script"], res2Records, resRecords),
      row["expiry"],
      row["peStrikePriceSell"],
      'PE'
    ),
  }));
  localTableState?.forEach((row) =>
    getAlert2(
      row.id,
      row.peStrikePriceSellCost,
      row.peStrikePriceSellMonitored,
      row.peStrikePriceBuyCost,
      row.peStrikePriceBuyMonitored,
      row.ceStrikePriceSellCost,
      row.ceStrikePriceSellMonitored,
      row.ceStrikePriceBuyCost,
      row.ceStrikePriceBuyMonitored,
      setOutOfControlTrades
    )
  );
  return localTableState;
};

export const getAlert2 = (
  id,
  _peStrikePriceSellCost,
  _peStrikePriceSellMonitored,
  _peStrikePriceBuyCost,
  _peStrikePriceBuyMonitored,
  _ceStrikePriceSellCost,
  _ceStrikePriceSellMonitored,
  _ceStrikePriceBuyCost,
  _ceStrikePriceBuyMonitored,
  setOutOfControlTrades
) => {
  if (
    _peStrikePriceSellCost &&
    _peStrikePriceSellMonitored &&
    _peStrikePriceBuyCost &&
    _peStrikePriceBuyMonitored &&
    _ceStrikePriceSellCost &&
    _ceStrikePriceSellMonitored &&
    _ceStrikePriceBuyCost &&
    _ceStrikePriceBuyMonitored
  )
    if (
      parseFloat(_peStrikePriceSellMonitored) +
        parseFloat(_ceStrikePriceSellMonitored) -
        parseFloat(_peStrikePriceBuyMonitored) -
        parseFloat(_ceStrikePriceBuyMonitored) >
      1.3 *
        (parseFloat(_peStrikePriceSellCost) +
          parseFloat(_ceStrikePriceSellCost) -
          parseFloat(_peStrikePriceBuyCost) -
          parseFloat(_ceStrikePriceBuyCost))
    ) {
        console.log("ALERT")
        schedulePushNotification("Trade Going out of control");
        setOutOfControlTrades(id);
        return "ALERT";
    }
};

export const getPriceByStrikePriceExpiryUg = (records, expiry, strikePrice,key) => {
  if (records && expiry && strikePrice) {
    let vtm = records.data
      ?.filter((val) => val.strikePrice == strikePrice)
      .filter((val) => val.expiryDate == expiry);
    if (vtm?.length >= 1) return vtm[0]?.[key]?.lastPrice;
  }
};

export async function schedulePushNotification(title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: { data: "goes here" },
      },
      trigger: { seconds: 1 },
    });
  } catch (e) {
    console.log("ERROR 2");
  }
}

export async function registerForPushNotificationsAsync() {
  try {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      // let token2 = await Notifications.getExpoPushTokenAsync({
      //   projectId: Constants.expoConfig.extra.eas.projectId,
      // });
      // console.log(token2.data + ' TOKEN2')
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig.extra.eas.projectId,
        })
      ).data;
    } else {
      alert("Must use physical device for Push Notifications");
    }

    return token;
  } catch (error) {
    console.log("FAILED");
  }
}

export async function some(script, setState, fail = 0) {
    console.log("APICALLinPROGRESS " + script);
    return new Promise((res,rej)=>{
        axios
        .get(
          `https://www.nseindia.com/api/option-chain-indices?symbol=${script}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
              "Accept-Encoding": "gzip, deflate, br",
              "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
            },
          }
        )
        .then((response) => {
          if (response) {
            setState(response.data);
            res(response.data);
          }
        })
        .catch((error) => {
          if (fail < 2) setTimeout(() => some(script, setState, fail + 1), 5000);
          else{
            rej("FAIL")
          }
          console.error("Error fetching data:asd ", error);

        });
    })
 
  }
