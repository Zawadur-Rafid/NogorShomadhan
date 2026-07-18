import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MyComplaintsScreen() {
  return (
    <View style={styles.contentContainer}>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderText}>
          Work is in progress for now
        </Text>
        <Text style={styles.subText}>
          (My Complaints Section)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
});
