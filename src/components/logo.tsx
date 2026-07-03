import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface LogoProps {
  onPress?: () => void;
  size?: 'small' | 'large';
}

export default function Logo({ onPress, size = 'large' }: LogoProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/');
    }
  };

  const isSmall = size === 'small';

  return (
    <TouchableOpacity 
      activeOpacity={0.8} 
      onPress={handlePress}
      style={styles.container}
    >
      <View style={[styles.iconContainer, isSmall && styles.iconContainerSmall]}>
        <MaterialIcons 
          name="location-city" 
          size={isSmall ? 28 : 48} 
          color="#ffffff" 
        />
      </View>
      <Text style={[styles.title, isSmall && styles.titleSmall]}>
        Nogor Shomadhan
      </Text>
      {!isSmall && (
        <Text style={styles.subtitle}>Smart Solutions for a Better City</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#1a5f7a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainerSmall: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 28,
    fontWeight: '700',
    color: '#00475e',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 20,
    marginBottom: 0,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#40484d',
    textAlign: 'center',
    maxWidth: 280,
  },
});
