import React from 'react';
import { LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Slot, usePathname, useRouter } from 'expo-router';
import BottomNav from '../../../components/BottomNav';
import TopNav from '../../../components/TopNav';

export default function ComplaintsLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabPress = (path: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    router.push(path as any);
  };

  const isNew = pathname.endsWith('create');
  const isMy = pathname.endsWith('my');
  // If not create or my, we assume it's index (All)
  const isAll = !isNew && !isMy;

  return (
    <SafeAreaView style={styles.container}>
      <TopNav />

      {/* Top Tab Navigation (Card Style) */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, isNew && styles.activeTabButton]}
            onPress={() => handleTabPress('/(resident)/complaints/create')}
          >
            <Text style={[styles.tabText, isNew && styles.activeTabText]}>
              New Complaint
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, isAll && styles.activeTabButton]}
            onPress={() => handleTabPress('/(resident)/complaints')}
          >
            <Text style={[styles.tabText, isAll && styles.activeTabText]}>
              All Complaints
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, isMy && styles.activeTabButton]}
            onPress={() => handleTabPress('/(resident)/complaints/my')}
          >
            <Text style={[styles.tabText, isMy && styles.activeTabText]}>
              My Complaints
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
    backgroundColor: '#F7F8FA',
  },
  tabWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#F7F8FA',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8EDF4',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#23435D',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  }
});
