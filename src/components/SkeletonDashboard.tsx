import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ScrollView } from 'react-native';

const SkeletonDashboard = () => {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: pulseAnim }]}>
        <View style={styles.welcome}>
          <View style={styles.smallTitleSkeleton} />
          <View style={styles.bigTitleSkeleton} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.whiteCard} />
          <View style={styles.whiteCard} />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.whiteCard} />
          <View style={styles.whiteCard} />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleSkeleton} />
          <View style={styles.viewAllSkeleton} />
        </View>

        <View style={styles.complaintCard}>
           <View style={styles.iconCircle} />
           <View style={styles.titleArea}>
             <View style={styles.titleSkeleton} />
             <View style={styles.descSkeleton} />
           </View>
        </View>
        <View style={styles.complaintCard}>
           <View style={styles.iconCircle} />
           <View style={styles.titleArea}>
             <View style={styles.titleSkeleton} />
             <View style={styles.descSkeleton} />
           </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  content: {
    paddingBottom: 40,
  },
  welcome: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  smallTitleSkeleton: {
    height: 12,
    width: 100,
    backgroundColor: '#eceef0',
    borderRadius: 4,
    marginBottom: 6,
  },
  bigTitleSkeleton: {
    height: 28,
    width: 200,
    backgroundColor: '#eceef0',
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 12,
  },
  whiteCard: {
    width: "48%",
    height: 90,
    backgroundColor: "#eceef0",
    borderRadius: 12,
  },
  sectionHeader: {
    marginTop: 24,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleSkeleton: {
    height: 20,
    width: 140,
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
  viewAllSkeleton: {
    height: 14,
    width: 50,
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
  complaintCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(192, 200, 205, 0.3)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eceef0",
  },
  titleArea: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  titleSkeleton: {
    height: 16,
    width: '60%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
  descSkeleton: {
    height: 12,
    width: '90%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
});

export default SkeletonDashboard;
