import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Dropdown({ data = [], label, onChange, styles, _value =''  }) {
  const [value, setValue] = useState(_value);
  const [filteredData, setFilteredData] = useState(data);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(()=>{
    setValue(_value)
  },[_value])
  useEffect(() => {
    if (data.length > 0) {
      if (isOpen && (value || value == "") && data.length > 0)
        setFilteredData(
          data?.filter((val) =>
            val.value.toLowerCase().includes(value.toLowerCase())
          )
        );
      else setFilteredData([]);
    }
  }, [isOpen, value, data]);

  return (
    <View style={{ height: 50, marginBottom: 5 }}>
      <View
        style={{
          height: Math.min(filteredData.length * 70 + 5, 285),
          width: "auto",
          zIndex: isOpen ? 5 : 2,
          position: "relative",
        }}
      >
        <TextInput
          style={styles.fieldStyleGeneral}
          value={value}
          onFocus={() => {
            setIsOpen(true);
          }}
          onBlur={() => setIsOpen(false)}
          onChangeText={(e) => {
            setValue(e);
            onChange(e);
            if (!isOpen) {
              setIsOpen(true);
            }
          }}
          placeholder={label}
        ></TextInput>
        {isOpen && (
          <FlatList
            keyboardShouldPersistTaps={"always"}
            scrollEnabled
            
            contentContainerStyle={{
              position: "relative",
              overflow: "scroll",
              width: "100%",
            }}
            style={{
              position: "absolute",
              overflow: "scroll",
              zIndex: 50,
              opacity: 0.8,
              borderRadius: 5,
              border: 1,
              borderColor: "gray",
              backgroundColor: "white",
              top: 50,
              width: "95%",
              maxHeight: Math.min(filteredData.length * 70 + 5, 285),
            }}
            data={data.some((val) => val.value == value) ? [] : filteredData}
            renderItem={({ item }) => (
              <TouchableOpacity
              style={{
                flex: 1,
                width: "100%",
                alignItems: "center",
                  overflow: "auto",
                  zIndex: 100,
                  margin: 2,
                  padding: 15,
                  borderColor: "gray",
                  borderWidth: 1,
                  borderRadius: 5,
                  alignItems: "center",
                  flex: 1,
                  textAlign: "center",
              }}
              onPress={(e) => {
                setValue(item.value);
                onChange(item.value);
                setIsOpen(false);
                //   setFilteredExpiryToShow([]);
                // C:\Users\sahil\AppData\Local\Android\Sdk
              }}
            >
              <View
          
              >
               
                  <Text>{item.value}</Text>
              </View>
                </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
}
