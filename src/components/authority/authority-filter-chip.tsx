import { Pressable, StyleSheet, Text, View } from 'react-native';

type AuthorityFilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export default function AuthorityFilterChip({
  label,
  count,
  active,
  disabled = false,
  onPress,
}: AuthorityFilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count} complaints`}
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        disabled && styles.chipDisabled,
        pressed && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.label,
          active && styles.labelActive,
          disabled && styles.labelDisabled,
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.countBadge,
          active && styles.countBadgeActive,
          disabled && styles.countBadgeDisabled,
        ]}
      >
        <Text
          style={[
            styles.countText,
            active && styles.countTextActive,
            disabled && styles.countTextDisabled,
          ]}
        >
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EB',
  },
  chipActive: {
    backgroundColor: '#23435D',
    borderColor: '#23435D',
  },
  chipDisabled: {
    backgroundColor: '#F1F3F5',
    borderColor: '#E6E9ED',
  },
  chipPressed: {
    opacity: 0.72,
  },
  label: {
    color: '#667085',
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelDisabled: {
    color: '#A8AFB8',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#EEF1F4',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  countBadgeDisabled: {
    backgroundColor: '#E3E6EA',
  },
  countText: {
    color: '#475467',
    fontSize: 8,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  countTextActive: {
    color: '#FFFFFF',
  },
  countTextDisabled: {
    color: '#9AA2AD',
  },
});
