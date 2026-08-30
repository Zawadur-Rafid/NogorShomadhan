import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ConfirmState {
  visible: boolean;
  title: string;
  message: string;
  isDestructive: boolean;
  resolve: (value: boolean) => void;
}

let setModalStateGlobal: React.Dispatch<React.SetStateAction<ConfirmState | null>> | null = null;

/**
 * Prompts a custom styled confirmation popup dialog with 'Yes' and 'No' buttons
 * matching the Nogor Shomadhan design system.
 *
 * Resolves to true if 'Yes' is selected, false if 'No' or backdrop is tapped.
 * If an onConfirm callback is provided, it is automatically executed on 'Yes'.
 */
export function confirmAction(
  message: string,
  onConfirm?: () => void | Promise<void>,
  title: string = 'Confirmation',
  onCancel?: () => void
): Promise<boolean> {
  const lowerMsg = message.toLowerCase();
  const lowerTitle = title.toLowerCase();
  const isDestructive =
    lowerMsg.includes('delete') ||
    lowerMsg.includes('reject') ||
    lowerMsg.includes('remove') ||
    lowerTitle.includes('delete') ||
    lowerTitle.includes('reject');

  return new Promise<boolean>((resolve) => {
    const handleResolve = (result: boolean) => {
      resolve(result);
      if (result) {
        if (onConfirm) void onConfirm();
      } else {
        if (onCancel) onCancel();
      }
    };

    if (setModalStateGlobal) {
      setModalStateGlobal({
        visible: true,
        title,
        message,
        isDestructive,
        resolve: handleResolve,
      });
    } else {
      // Direct fallback if provider is not yet attached
      import('react-native').then(({ Alert, Platform }) => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
          const res = window.confirm(message);
          handleResolve(res);
          return;
        }
        Alert.alert(
          title,
          message,
          [
            { text: 'No', style: 'cancel', onPress: () => handleResolve(false) },
            { text: 'Yes', onPress: () => handleResolve(true) },
          ],
          { cancelable: true, onDismiss: () => handleResolve(false) }
        );
      });
    }
  });
}

/**
 * Global component rendered at the root of the app in _layout.tsx.
 * Renders the custom styled Confirmation Dialog.
 */
export function GlobalConfirmModal() {
  const [state, setState] = useState<ConfirmState | null>(null);

  useEffect(() => {
    setModalStateGlobal = setState;
    return () => {
      setModalStateGlobal = null;
    };
  }, []);

  if (!state || !state.visible) return null;

  const handleNo = () => {
    const res = state.resolve;
    setState(null);
    res(false);
  };

  const handleYes = () => {
    const res = state.resolve;
    setState(null);
    res(true);
  };

  const isDestructive = state.isDestructive;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={state.visible}
      onRequestClose={handleNo}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleNo}>
        <Pressable style={styles.dialogCard} onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.iconWrap,
              isDestructive ? styles.iconWrapDanger : styles.iconWrapPrimary,
            ]}
          >
            <Ionicons
              name={
                isDestructive
                  ? 'trash-outline'
                  : 'help-circle-outline'
              }
              size={26}
              color={isDestructive ? '#D92D20' : '#23435D'}
            />
          </View>

          <Text style={styles.title}>{state.title}</Text>
          <Text style={styles.message}>{state.message}</Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="No"
              onPress={handleNo}
              style={({ pressed }) => [
                styles.button,
                styles.noButton,
                pressed && styles.noButtonPressed,
              ]}
            >
              <Text style={styles.noButtonText}>No</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Yes"
              onPress={handleYes}
              style={({ pressed }) => [
                styles.button,
                isDestructive ? styles.yesButtonDanger : styles.yesButtonPrimary,
                pressed &&
                  (isDestructive
                    ? styles.yesButtonDangerPressed
                    : styles.yesButtonPrimaryPressed),
              ]}
            >
              <Text style={styles.yesButtonText}>Yes</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    padding: 22,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EAECF0',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconWrapPrimary: {
    backgroundColor: '#EAF0F6',
  },
  iconWrapDanger: {
    backgroundColor: '#FEE4E2',
  },
  title: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  message: {
    marginTop: 8,
    color: '#667085',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 22,
    width: '100%',
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  noButton: {
    backgroundColor: '#F2F4F7',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  noButtonPressed: {
    backgroundColor: '#E4E7EC',
  },
  noButtonText: {
    color: '#344054',
    fontSize: 14,
    fontWeight: '700',
  },
  yesButtonPrimary: {
    backgroundColor: '#23435D',
  },
  yesButtonPrimaryPressed: {
    backgroundColor: '#193043',
  },
  yesButtonDanger: {
    backgroundColor: '#D92D20',
  },
  yesButtonDangerPressed: {
    backgroundColor: '#B42318',
  },
  yesButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
