import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useModalStore } from '@/stores/useModalStore';

export default function PlannerFab() {
  const router = useRouter();
  const openFocus = useModalStore((state) => state.openPlannerFocusModal);

  return (
    <View style={styles.container}>
      <View style={styles.menu}>
        <Pressable style={styles.menuButton} onPress={openFocus}>
          <Ionicons name="timer-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.menuText}>Start focus</Text>
        </Pressable>
        <Pressable style={styles.menuButton} onPress={() => router.push('/(modals)/planner/task')}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.menuText}>Add task</Text>
        </Pressable>
      </View>
      <Pressable style={styles.mainFab} onPress={() => router.push('/(modals)/planner/task')}>
        <Ionicons name="add" size={26} color="#000" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    alignItems: 'flex-end',
    gap: 12,
  },
  menu: {
    width: 168,
    gap: 10,
  },
  menuButton: {
    height: 44,
    borderRadius: 16,
    backgroundColor: '#1F1F22',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  menuText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 12,
  },
});
