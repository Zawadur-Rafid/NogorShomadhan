import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function TopNav() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

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
        
        <View style={{ zIndex: 50 }}>
          <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
            <Ionicons
              style={{ marginLeft: 12 }}
              name="person-circle"
              size={30}
              color="#23435D"
            />
          </TouchableOpacity>
          
          {menuVisible && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(resident)/profile');
                }}
              >
                <Ionicons name="person-outline" size={16} color="#23435D" />
                <Text style={styles.dropdownText}>My Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setMenuVisible(false);
                  router.replace('/');
                }}
              >
                <Ionicons name="log-out-outline" size={16} color="#D32F2F" />
                <Text style={[styles.dropdownText, { color: '#D32F2F' }]}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    zIndex: 10,
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
    zIndex: 50,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 150,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});
