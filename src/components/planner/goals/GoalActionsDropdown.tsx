import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/constants/theme';

export type GoalDropdownAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  actions: GoalDropdownAction[];
  anchorStyle?: any;
};

export const GoalActionsDropdown: React.FC<Props> = ({ visible, onClose, actions, anchorStyle }) => {
  const theme = useAppTheme();
  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          anchorStyle,
        ]}
        onPress={(e) => e.stopPropagation()}
      >
        {actions.map((action, idx) => (
          <Pressable
            key={action.label + idx}
            style={styles.item}
            onPress={() => {
              onClose();
              action.onPress();
            }}
          >
            <Text
              style={[
                styles.label,
                { color: action.destructive ? '#F87171' : theme.colors.textPrimary },
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </Pressable>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
  },
  card: {
    position: 'absolute',
    right: 12,
    top: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default GoalActionsDropdown;
