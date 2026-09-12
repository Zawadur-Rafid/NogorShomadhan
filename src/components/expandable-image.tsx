import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, type ImageProps } from 'expo-image';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ExpandableImageProps = Omit<ImageProps, 'style'> & {
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export default function ExpandableImage({
  accessibilityLabel = 'View image full screen',
  style,
  ...imageProps
}: ExpandableImageProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        accessibilityHint="Opens a full-screen image preview"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={[styles.preview, style]}
      >
        <Image {...imageProps} style={StyleSheet.absoluteFill} />
      </Pressable>

      <Modal
        animationType="fade"
        hardwareAccelerated
        navigationBarTranslucent
        onRequestClose={() => setVisible(false)}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        transparent
        visible={visible}
      >
        <View
          accessibilityViewIsModal
          style={styles.overlay}
        >
          <Pressable
            accessibilityLabel="Close full-screen image"
            accessibilityRole="button"
            onPress={() => setVisible(false)}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView pointerEvents="box-none" style={styles.safeArea}>
            <Image
              {...imageProps}
              contentFit="contain"
              pointerEvents="none"
              style={styles.fullImage}
              transition={120}
            />
            <Pressable
              accessibilityLabel="Close full-screen image"
              accessibilityRole="button"
              hitSlop={20}
              onPress={() => setVisible(false)}
              pressRetentionOffset={24}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  preview: {
    overflow: 'hidden',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.96)',
  },
  safeArea: {
    flex: 1,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 2,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(24, 24, 27, 0.78)',
  },
  closeButtonPressed: {
    opacity: 0.72,
  },
});
