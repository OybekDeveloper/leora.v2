import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { X, Trash2, RotateCcw, CheckSquare, Archive } from 'lucide-react-native';
import { useAppTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SelectionToolbarProps {
  visible: boolean;
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onArchive?: () => void;  // Soft delete - move to history
  onDelete: () => void;    // Hard delete - permanent removal
  onRestore?: () => void;  // Restore from history
  onCancel: () => void;
  isHistoryMode?: boolean;
  strings?: {
    selected: string;
    selectAll: string;
    archive: string;
    delete: string;
    deleteForever: string;
    restore: string;
    cancel: string;
  };
}

const defaultStrings = {
  selected: 'selected',
  selectAll: 'Select All',
  archive: 'Archive',
  delete: 'Delete',
  deleteForever: 'Delete Forever',
  restore: 'Restore',
  cancel: 'Cancel',
};

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  visible,
  selectedCount,
  totalCount,
  onSelectAll,
  onArchive,
  onDelete,
  onRestore,
  onCancel,
  isHistoryMode = false,
  strings = defaultStrings,
}) => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(visible ? 0 : 120, {
            damping: 20,
            stiffness: 200,
          }),
        },
      ],
      opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    };
  }, [visible]);

  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 16),
        },
        animatedStyle,
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {/* Top row: Counter and Cancel */}
      <View style={styles.topRow}>
        <Text style={[styles.counterText, { color: theme.colors.textPrimary }]}>
          {selectedCount} {strings.selected}
        </Text>
        <Pressable
          onPress={onCancel}
          style={[styles.cancelButton, { backgroundColor: theme.colors.surfaceMuted }]}
          hitSlop={8}
        >
          <X size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        {/* Select All */}
        <Pressable
          onPress={onSelectAll}
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.surfaceMuted },
            isAllSelected && { backgroundColor: `${theme.colors.primary}20` },
          ]}
        >
          <CheckSquare
            size={20}
            color={isAllSelected ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.actionText,
              { color: isAllSelected ? theme.colors.primary : theme.colors.textSecondary },
            ]}
          >
            {strings.selectAll}
          </Text>
        </Pressable>

        {/* Archive (only in normal mode - soft delete, moves to history) */}
        {!isHistoryMode && onArchive && (
          <Pressable
            onPress={onArchive}
            disabled={selectedCount === 0}
            style={[
              styles.actionButton,
              { backgroundColor: `${theme.colors.warning}15` },
              selectedCount === 0 && styles.disabledButton,
            ]}
          >
            <Archive size={20} color={theme.colors.warning} />
            <Text style={[styles.actionText, { color: theme.colors.warning }]}>
              {strings.archive}
            </Text>
          </Pressable>
        )}

        {/* Restore (only in history mode) */}
        {isHistoryMode && onRestore && (
          <Pressable
            onPress={onRestore}
            disabled={selectedCount === 0}
            style={[
              styles.actionButton,
              { backgroundColor: `${theme.colors.primary}20` },
              selectedCount === 0 && styles.disabledButton,
            ]}
          >
            <RotateCcw size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              {strings.restore}
            </Text>
          </Pressable>
        )}

        {/* Delete - permanent removal */}
        <Pressable
          onPress={onDelete}
          disabled={selectedCount === 0}
          style={[
            styles.actionButton,
            { backgroundColor: `${theme.colors.danger}15` },
            selectedCount === 0 && styles.disabledButton,
          ]}
        >
          <Trash2 size={20} color={theme.colors.danger} />
          <Text style={[styles.actionText, { color: theme.colors.danger }]}>
            {isHistoryMode ? strings.deleteForever : strings.delete}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default SelectionToolbar;
