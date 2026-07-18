import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";

export default function TopNav() {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/images/main_logo.png")}
          style={{ width: 24, height: 24, borderRadius: 6 }}
        />
        <Text style={styles.logo}>Nogor Shomadhan</Text>
      </View>
      <View style={styles.rightSection}>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={20} color="#23435D" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(resident)/profile')}>
          <Ionicons
            style={{ marginLeft: 12 }}
            name="person-circle"
            size={30}
            color="#23435D"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "700",
    color: "#23435D",
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
});
