import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AdminRoute = "home" | "users" | "complaints" | "analytics" | "forum";

interface AdminBottomNavProps {
  activeRoute: AdminRoute;
}

export default function AdminBottomNav({ activeRoute }: AdminBottomNavProps) {
  const router = useRouter();

  const items: Array<{
    key: AdminRoute;
    label: string;
    activeIcon: keyof typeof Ionicons.glyphMap;
    inactiveIcon: keyof typeof Ionicons.glyphMap;
    path?: string;
  }> = [
    {
      key: "home",
      label: "Home",
      activeIcon: "home",
      inactiveIcon: "home-outline",
      path: "/(admin)/dashboard",
    },
    {
      key: "users",
      label: "Users",
      activeIcon: "people",
      inactiveIcon: "people-outline",
      path: "/(admin)/accounts/pending",
    },
    {
      key: "complaints",
      label: "Complaints",
      activeIcon: "document-text",
      inactiveIcon: "document-text-outline",
      path: "/(admin)/complaints/all",
    },
    {
      key: "analytics",
      label: "analytics",
      activeIcon: "bar-chart",
      inactiveIcon: "bar-chart-outline",
      path: "/(admin)/analytics",
    },
    {
      key: "forum",
      label: "Forum",
      activeIcon: "chatbubbles",
      inactiveIcon: "chatbubbles-outline",
      path: "/(admin)/forum",
    },
  ];

  return (
    <View style={styles.bottomNavigation}>
      {items.map((item) => {
        const isActive = activeRoute === item.key;

        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navButton}
            activeOpacity={0.85}
            onPress={() => {
              if (item.path) {
                router.push(item.path as any);
              }
            }}
          >
            <Ionicons
              name={isActive ? item.activeIcon : item.inactiveIcon}
              size={20}
              color={isActive ? "#1E4867" : "#888"}
            />
            <Text style={isActive ? styles.activeNavText : styles.navText}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    height: 68,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navButton: {
    alignItems: "center",
  },
  activeNavText: {
    marginTop: 4,
    color: "#1E4867",
    fontSize: 11,
    fontFamily: "Times New Roman",
    fontWeight: "700",
  },
  navText: {
    marginTop: 4,
    color: "#666",
    fontSize: 11,
    fontFamily: "Times New Roman",
  },
});
