import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

interface BottomNavProps {
  activeRoute: 'home' | 'map' | 'complaints' | 'data' | 'profile';
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const router = useRouter();

  const renderIcon = (name: any, route: string, iconActive: any, iconInactive: any, label: string, path?: string) => {
    const isActive = activeRoute === route;
    return (
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => {
          if (path && !isActive) {
            router.push(path as any);
          }
        }}
      >
        <Ionicons 
          name={isActive ? iconActive : iconInactive} 
          size={20} 
          color={isActive ? "#23435D" : "#888"} 
        />
        <Text style={isActive ? styles.activeNav : styles.navText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.bottomNav}>
      {renderIcon('home', 'home', 'home', 'home-outline', 'Home', '/(resident)/dashboard')}
      {renderIcon('map', 'map', 'map', 'map-outline', 'Map', '/(resident)/map')}
      {renderIcon('complaints', 'complaints', 'document-text', 'document-text-outline', 'Complaints', '/(resident)/complaints')}
      {renderIcon('data', 'data', 'bar-chart', 'bar-chart-outline', 'Data')}
      {renderIcon('profile', 'profile', 'person', 'person-outline', 'Profile', '/(resident)/profile')}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 60,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 4,
  },
  navItem: {
    alignItems: "center",
  },
  activeNav: {
    marginTop: 2,
    color: "#23435D",
    fontWeight: "700",
    fontSize: 10,
    fontFamily: "Inter",
  },
  navText: {
    marginTop: 2,
    color: "#8A8A8A",
    fontSize: 10,
    fontFamily: "Inter",
  },
});
