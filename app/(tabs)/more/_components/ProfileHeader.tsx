import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAppTheme } from '@/constants/theme';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';

type ProfileHeaderProps = {
  title?: string;
  onBack?: () => void;
  onEdit?: () => void;
  changeTitle?: string;
};

const BUTTON_SIZE = 44;

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title = 'Profile',
  onBack,
  onEdit,
  changeTitle
}) => {
  const insets = useSafeAreaInsets();
  const theme = useAppTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/(tabs)/more");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit()
    }
  };

  const showEdit = Boolean(onEdit);

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingTop: insets.top + 12,
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.borderMuted ?? theme.colors.border,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.sideSlot}>
          <AdaptiveGlassView style={styles.glassButton}>
            <Pressable
              onPress={handleBack}
              hitSlop={12}
              style={({ pressed }) => [
                styles.iconButton,
                {
                  backgroundColor:
                    theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ChevronLeft size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </AdaptiveGlassView>
        </View>

        <View style={styles.titleBlock} pointerEvents="none">
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {title.toUpperCase()}
          </Text>
        </View>

        <View style={styles.sideSlot}>
          {showEdit ? (
            <Pressable
              onPress={handleEdit}
              hitSlop={12}
              style={({ pressed }) => [
                styles.editButton,
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={[styles.editLabel, { color: theme.colors.textSecondary }]}>{changeTitle}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export default ProfileHeader;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideSlot: {
    height: BUTTON_SIZE,
    justifyContent: 'center',
    flex: 1,
  },
  glassButton: {
    borderRadius: 12,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
  },
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  editLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  titleBlock: {
    flex: 0,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },
  changeTitle: {
    fontSize: 16,
    fontWeight: '600',
  }
});
