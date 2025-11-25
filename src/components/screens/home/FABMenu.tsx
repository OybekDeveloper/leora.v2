import { Check, Clock, Plus, Target } from 'lucide-react-native';
import React, { useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

interface FABAction {
  id: string;
  icon: any;
  color: string;
  label: string;
}

interface FABMenuProps {
  onAddTask?: () => void;
  onQuickExpense?: () => void;
  onStartFocus?: () => void;
}

const ACTIONS: FABAction[] = [
  { id: 'task', icon: Check, color: '#4CAF50', label: 'ADD TASK' },
  { id: 'expense', icon: Target, color: '#F44336', label: 'QUICK EXPENSE' },
  { id: 'focus', icon: Clock, color: '#FF9800', label: 'START FOCUS' },
];

export default function FABMenu({
  onAddTask,
  onQuickExpense,
  onStartFocus,
}: FABMenuProps) {
  const [expanded, setExpanded] = useState(false);
  const [rotation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    
    Animated.spring(rotation, {
      toValue,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    setExpanded(!expanded);
  };

  const handleActionPress = (actionId: string) => {
    toggleExpanded();
    
    switch (actionId) {
      case 'task':
        onAddTask?.();
        break;
      case 'expense':
        onQuickExpense?.();
        break;
      case 'focus':
        onStartFocus?.();
        break;
    }
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {expanded &&
        ACTIONS.map((action, index) => {
          const Icon = action.icon;
          return (
            <Animated.View
              key={action.id}
              style={[
                styles.actionButton,
                {
                  bottom: 80 + index * 60,
                  backgroundColor: action.color,
                  opacity: rotation,
                  transform: [
                    {
                      scale: rotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleActionPress(action.id)}
                style={styles.actionButtonInner}
                activeOpacity={0.8}
              >
                <Icon color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}

      <TouchableOpacity
        style={styles.fab}
        onPress={toggleExpanded}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Plus color="#000000" size={28} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 96,
    right: 16,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    position: 'absolute',
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
