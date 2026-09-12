import { Slot, usePathname, useRouter } from "expo-router";
import {
    LayoutAnimation,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../../../components/BottomNav";
import ResidentPageHeader from "@/components/resident-page-header";

export default function ComplaintsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isComplaintDetail = /^\/complaints\/(?!create\/?$|my\/?$)[^/]+\/?$/.test(pathname);

  const activeTab = pathname.endsWith("create")
    ? "create"
    : pathname.endsWith("my")
      ? "my"
      : "all";

  const handleTabPress = (path: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    router.push(path as any);
  };

  const isNew = activeTab === "create";
  const isMy = activeTab === "my";
  const isAll = activeTab === "all";

  return (
    <SafeAreaView style={styles.container}>
      {!isComplaintDetail && <ResidentPageHeader />}

      {/* Top Tab Navigation (Card Style) */}
      {!isComplaintDetail && (
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, isNew && styles.activeTabButton]}
              onPress={() => handleTabPress("/(resident)/complaints/create")}
            >
              <Text style={[styles.tabText, isNew && styles.activeTabText]}>
                New Complaint
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, isAll && styles.activeTabButton]}
              onPress={() => handleTabPress("/(resident)/complaints")}
            >
              <Text style={[styles.tabText, isAll && styles.activeTabText]}>
                All Complaints
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, isMy && styles.activeTabButton]}
              onPress={() => handleTabPress("/(resident)/complaints/my")}
            >
              <Text style={[styles.tabText, isMy && styles.activeTabText]}>
                My Complaints
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.contentContainer}>
        <Slot />
      </View>

      <BottomNav activeRoute="complaints" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  tabWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#F7F8FA",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#E8EDF4",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#23435D",
  },
  tabText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
    fontFamily: "System",
    textAlign: "center",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
});
