import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useShallow } from 'zustand/react/shallow';
import { Calendar, Info } from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

type Props = {
  taskId?: string;
  goalId?: string;
};

export function TaskComponent({ taskId, goalId }: Props) {
  const theme = useAppTheme();
  const router = useRouter();
  const { tasks, createTask, updateTask } = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      createTask: state.createTask,
      updateTask: state.updateTask,
    }))
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Load task data if editing
  useEffect(() => {
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        if (task.dueDate) setDate(new Date(task.dueDate));
      }
    }
  }, [taskId, tasks]);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return;

    if (taskId) {
      updateTask(taskId, {
        title,
        description: description || undefined,
        dueDate: date?.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      createTask({
        userId: 'current-user',
        title,
        description: description || undefined,
        status: 'planned',
        priority: 'medium',
        dueDate: date?.toISOString(),
        goalId: goalId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Delay navigation to allow AsyncStorage to persist the changes
    setTimeout(() => {
      router.back();
    }, 100);
  }, [title, description, date, taskId, goalId, createTask, updateTask, router]);

  const handleDatePress = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date || new Date(),
        mode: 'date',
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setDate(selectedDate);
          }
        },
      });
    } else {
      setShowDatePicker(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {taskId ? 'Edit Task' : 'New Task'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Task Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            placeholderTextColor={theme.colors.textMuted}
            autoFocus
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.colors.card, color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add description (optional)"
            placeholderTextColor={theme.colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Due Date</Text>
          <Pressable
            style={[styles.dateButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleDatePress}
          >
            <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
              {date ? date.toLocaleDateString() : 'Select date'}
            </Text>
          </Pressable>
        </View>

        {goalId && (
          <View style={[styles.infoBox, { backgroundColor: `${theme.colors.primary}15`, borderColor: `${theme.colors.primary}40` }]}>
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              This task will be linked to the selected goal
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
        <Pressable
          style={[styles.button, styles.buttonSecondary, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonSecondaryText, { color: theme.colors.textPrimary }]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.buttonPrimary, { backgroundColor: theme.colors.primary }]}
          onPress={handleSubmit}
          disabled={!title.trim()}
        >
          <Text style={styles.buttonPrimaryText}>{taskId ? 'Update' : 'Create'} Task</Text>
        </Pressable>
      </View>

      {Platform.OS === 'ios' && showDatePicker && (
        <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            display="spinner"
            onChange={(event, selectedDate) => {
              if (event.type === 'set' && selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
          <Pressable
            style={styles.pickerDoneButton}
            onPress={() => setShowDatePicker(false)}
          >
            <Text style={[styles.pickerDoneText, { color: theme.colors.primary }]}>Done</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  dateButtonText: {
    fontSize: 16,
  },
  infoBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPrimary: {},
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerDoneButton: {
    alignItems: 'center',
    padding: 12,
  },
  pickerDoneText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
