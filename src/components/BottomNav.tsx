import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';

interface BottomNavProps {
  activeRoute: 'home' | 'complaints' | 'analytics' | 'forum';
}

export default function BottomNav({ activeRoute }: BottomNavProps) {
  const router = useRouter();

  const renderIcon = (route: BottomNavProps['activeRoute'], iconActive: any, iconInactive: any, label: string, path: string) => {
    const isActive = activeRoute === route;
    return (
      <TouchableOpacity 
        style={styles.navItem} 
        onPress={() => {
          if (!isActive) {
            router.navigate(path as never);
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
      {renderIcon('home', 'home', 'home-outline', 'Home', '/dashboard')}
      {renderIcon('complaints', 'document-text', 'document-text-outline', 'Complaints', '/complaints')}
      {renderIcon('analytics', 'bar-chart', 'bar-chart-outline', 'Analytics', '/analytics')}
      {renderIcon('forum', 'chatbubbles', 'chatbubbles-outline', 'Forum', '/forum')}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    minHeight: 64,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 7,
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
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
