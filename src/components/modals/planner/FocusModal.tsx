import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';

import CustomModal, { CustomModalProps } from '@/components/modals/CustomModal';
import { BottomSheetHandle } from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useModalStore } from '@/stores/useModalStore';

const TECHNIQUES = [
  { key: 'pomodoro', title: 'Pomodoro', description: '25 min focus • 5 min break' },
  { key: 'blocks', title: 'Time blocks', description: '50 min focus • 10 min break' },
  { key: 'custom', title: 'Custom session', description: 'Set your own cadence' },
];

const BLOCKERS = [
  { key: 'notifications', label: 'Notifications', icon: 'notifications-off-outline' },
  { key: 'social', label: 'Social media', icon: 'logo-instagram' },
  { key: 'email', label: 'Email', icon: 'mail-outline' },
  { key: 'games', label: 'Games', icon: 'game-controller-outline' },
];

const modalProps: Partial<CustomModalProps> = {
  variant: 'form',
  enableDynamicSizing: true,
  fallbackSnapPoint: '75%',
  hasScrollableChildren: true,
  contentContainerStyle: { padding: 20, paddingBottom: 32 },
};

export default function PlannerFocusModal() {
  const { plannerFocusModal, closePlannerFocusModal } = useModalStore(
    useShallow((state) => ({
      plannerFocusModal: state.plannerFocusModal,
      closePlannerFocusModal: state.closePlannerFocusModal,
    }))
  );
  const modalRef = useRef<BottomSheetHandle>(null);

  useEffect(() => {
    if (plannerFocusModal.isOpen) {
      modalRef.current?.present();
    } else {
      modalRef.current?.dismiss();
    }
  }, [plannerFocusModal.isOpen]);

  return (
    <CustomModal ref={modalRef} onDismiss={closePlannerFocusModal} {...modalProps}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Focus mode</Text>
        <Pressable onPress={closePlannerFocusModal} style={styles.iconButton}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Technique</Text>
      <View style={styles.cardGroup}>
        {TECHNIQUES.map((item) => (
          <AdaptiveGlassView key={item.key} style={[styles.glassSurface, styles.techniqueCard]}>
            <Text style={styles.techniqueTitle}>{item.title}</Text>
            <Text style={styles.techniqueDescription}>{item.description}</Text>
          </AdaptiveGlassView>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Blocking options</Text>
      <View style={styles.blockList}>
        {BLOCKERS.map((item) => (
          <AdaptiveGlassView key={item.key} style={[styles.glassSurface, styles.blockRow]}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={18} color="#FFFFFF" style={{ marginRight: 12 }} />
            <Text style={styles.blockLabel}>{item.label}</Text>
            <Ionicons name="toggle" size={24} color="#4CAF50" style={{ marginLeft: 'auto' }} />
          </AdaptiveGlassView>
        ))}
      </View>

      <AdaptiveGlassView style={[styles.glassSurface, styles.aiBox]}>
        <Text style={styles.aiTitle}>AI insight</Text>
        <View style={styles.aiRow}>
          <Ionicons name="time-outline" size={16} color="#FFD60A" style={{ marginRight: 8 }} />
          <Text style={styles.aiText}>Typical focus window: 14:00 – 16:00. Recommended 3 cycles.</Text>
        </View>
      </AdaptiveGlassView>

      <Pressable style={styles.startButton}>
        <Ionicons name="play" size={18} color="#25252B" style={{ marginRight: 8 }} />
        <Text style={styles.startText}>Start session</Text>
      </Pressable>
    </CustomModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: '#9AA0A6',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  glassSurface: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardGroup: {
    gap: 12,
    marginBottom: 24,
  },
  techniqueCard: {
    borderRadius: 14,
    backgroundColor: '#111111',
    padding: 16,
  },
  techniqueTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  techniqueDescription: {
    color: '#7E8B9A',
    fontSize: 14,
  },
  blockList: {
    gap: 10,
    marginBottom: 24,
  },
  blockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#111111',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  blockLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  aiBox: {
    borderRadius: 16,
    backgroundColor: '#121212',
    padding: 16,
    marginBottom: 28,
  },
  aiTitle: {
    color: '#FFD60A',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiText: {
    color: '#F4F4F4',
    fontSize: 14,
    flex: 1,
  },
  startButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});
