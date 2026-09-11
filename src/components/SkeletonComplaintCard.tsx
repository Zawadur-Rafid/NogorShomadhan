import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const SkeletonComplaintCard = () => {
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
    <Animated.View style={[styles.card, { opacity: pulseAnim }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle} />
          <View style={styles.titleArea}>
            <View style={styles.titleSkeleton} />
            <View style={styles.categorySkeleton} />
          </View>
        </View>
        <View style={styles.statusBadgeSkeleton} />
      </View>
      <View style={styles.imageSkeleton} />
      <View style={styles.descLineSkeleton} />
      <View style={styles.descLineSkeletonShort} />
      <View style={styles.metaRow}>
        <View style={styles.locationSkeleton} />
      </View>
      <View style={styles.actionRow}>
        <View style={styles.btnSkeleton} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(192, 200, 205, 0.3)',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    backgroundColor: '#eceef0',
    borderRadius: 22,
  },
  titleArea: {
    flex: 1,
    gap: 6,
  },
  titleSkeleton: {
    height: 18,
    width: '70%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
  categorySkeleton: {
    height: 12,
    width: '40%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
  statusBadgeSkeleton: {
    width: 60,
    height: 22,
    backgroundColor: '#eceef0',
    borderRadius: 999,
  },
  imageSkeleton: {
    width: '100%',
    height: 180,
    backgroundColor: '#eceef0',
    borderRadius: 8,
    marginBottom: 12,
  },
  descLineSkeleton: {
    height: 14,
    width: '100%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
    marginBottom: 6,
  },
  descLineSkeletonShort: {
    height: 14,
    width: '60%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
    marginBottom: 12,
  },
  metaRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eceef0',
    marginBottom: 12,
  },
  locationSkeleton: {
    height: 12,
    width: '50%',
    backgroundColor: '#eceef0',
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
  },
  btnSkeleton: {
    flex: 1,
    height: 38,
    backgroundColor: '#eceef0',
    borderRadius: 8,
  },
});

export default SkeletonComplaintCard;
