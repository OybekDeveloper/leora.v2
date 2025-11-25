/* eslint-disable react/no-unescaped-entities */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useShallow } from 'zustand/react/shallow';
import {
  ArrowLeftRight,
  AtSign,
  Bell,
  CalendarDays,
  ChevronDown,
  Clock4,
  CreditCard,
  DollarSign,
  Flag,
  Heart,
  List,
  PieChart,
  Plus,
  Repeat,
  Square,
  SquareCheck,
  X,
  Zap,
} from 'lucide-react-native';

import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import type { TaskFinanceLink, TaskPriorityLevel } from '@/types/planner';
import { addDays, startOfDay } from '@/utils/calendar';

type AddTaskDateMode = 'today' | 'tomorrow' | 'pick';
type PlannerTaskCategoryId = 'work' | 'personal' | 'health' | 'learning' | 'errands';

const CATEGORY_PRESETS: { id: PlannerTaskCategoryId; context: string }[] = [
  { id: 'work', context: '@work' },
  { id: 'personal', context: '@home' },
  { id: 'health', context: '@health' },
  { id: 'learning', context: '@learning' },
  { id: 'errands', context: '@city' },
] as const;

const DATE_OPTIONS: AddTaskDateMode[] = ['today', 'tomorrow', 'pick'];

type ScheduleValidation = {
  valid: boolean;
  message?: string;
};

const toStartOfDay = (value: Date) => {
  const date = new Date(value);
  return startOfDay(date);
};

const combineDateAndTime = (mode: AddTaskDateMode, dateValue?: Date, timeValue?: string) => {
  let base = new Date();
  if (mode === 'tomorrow') {
    base = addDays(base, 1);
  } else if (mode === 'pick' && dateValue) {
    base = new Date(dateValue);
  }

  if (timeValue) {
    const [hours, minutes] = timeValue.split(':').map((n) => parseInt(n, 10));
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      base.setHours(hours, minutes, 0, 0);
    }
  } else if (mode !== 'today') {
    base.setHours(23, 59, 0, 0);
  }

  return base;
};

const validateSchedule = (mode: AddTaskDateMode, dateValue?: Date, timeValue?: string): ScheduleValidation => {
  if (mode === 'pick' && !dateValue) {
    return { valid: false, message: 'Please select a date' };
  }
  const now = new Date();
  const selected = combineDateAndTime(mode, dateValue, timeValue);
  const selectedDay = toStartOfDay(selected);
  const today = toStartOfDay(now);

  if (selectedDay.getTime() < today.getTime()) {
    return { valid: false, message: 'Cannot pick a past date' };
  }

  if (selectedDay.getTime() === today.getTime() && selected.getTime() < now.getTime()) {
    return { valid: false, message: 'Time must be in the future' };
  }

  return { valid: true };
};

export default function TaskModalScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { strings } = useLocalization();
  const addTaskStrings = strings.addTask;
  const { id: taskId, goalId: initialGoalId } = useLocalSearchParams<{ id?: string; goalId?: string }>();

  const { tasks, createTask, updateTask, goals } = usePlannerDomainStore(
    useShallow((state) => ({
      tasks: state.tasks,
      createTask: state.createTask,
      updateTask: state.updateTask,
      goals: state.goals,
    }))
  );

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const tokens = useMemo(
    () => ({
      card: theme.colors.card,
      cardItem: theme.colors.cardItem,
      elevated: theme.colors.surfaceElevated,
      textPrimary: theme.colors.textPrimary,
      textSecondary: theme.colors.textSecondary,
      muted: theme.colors.textMuted,
      separator: theme.colors.border,
      accent: theme.colors.primary,
    }),
    [theme.colors],
  );

  const categoryOptions = useMemo(
    () =>
      CATEGORY_PRESETS.map((preset) => ({
        ...preset,
        label: addTaskStrings.categories[preset.id as keyof typeof addTaskStrings.categories],
      })),
    [addTaskStrings],
  );
  const defaultCategoryId = categoryOptions[0]?.id ?? CATEGORY_PRESETS[0].id;

  // Form state
  const [title, setTitle] = useState('');
  const [dateMode, setDateMode] = useState<AddTaskDateMode>('tomorrow');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const [context, setContext] = useState<string | undefined>(CATEGORY_PRESETS[0].context);
  const [energy, setEnergy] = useState<1 | 2 | 3>(2);
  const [priority, setPriority] = useState<TaskPriorityLevel>('medium');
  const [selectedCategoryId, setSelectedCategoryId] = useState<PlannerTaskCategoryId>(defaultCategoryId);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(initialGoalId);
  const [progressValue, setProgressValue] = useState('');
  const [progressUnit, setProgressUnit] = useState('');
  const [financeLink, setFinanceLink] = useState<TaskFinanceLink>('none');

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [remindBeforeMin] = useState<number>(15);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatRule] = useState<string | undefined>('Everyday');
  const [needFocus, setNeedFocus] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [energyOpen, setEnergyOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);

  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const goalOptions = useMemo(
    () =>
      goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
      })),
    [goals],
  );

  const selectedGoal = useMemo(() => goals.find((goal) => goal.id === selectedGoalId), [goals, selectedGoalId]);

  useEffect(() => {
    if (!categoryOptions.some((option) => option.id === selectedCategoryId)) {
      setSelectedCategoryId(defaultCategoryId);
    }
  }, [categoryOptions, defaultCategoryId, selectedCategoryId]);

  useEffect(() => {
    if (selectedGoal?.unit && !progressUnit) {
      setProgressUnit(selectedGoal.unit);
    }
  }, [selectedGoal, progressUnit]);

  // Load task data if editing
  useEffect(() => {
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setTitle(task.title || '');
        setNotes(task.notes || '');
        if (task.dueDate) {
          setDate(new Date(task.dueDate));
          setDateMode('pick');
        }
        if (task.timeOfDay) setTime(task.timeOfDay);
        setContext(task.context);
        setEnergy(task.energyLevel ?? 2);
        setPriority(task.priority);
        setSelectedGoalId(task.goalId);
        setFinanceLink(task.financeLink ?? 'none');
        setNeedFocus(Boolean((task as any).needFocus ?? (task.focusTotalMinutes ?? 0) > 0));
        // Load other fields as needed
      }
    }
  }, [taskId, tasks]);

  const addSubtask = useCallback(() => {
    setSubtasks((prev) => [...prev, '']);
  }, []);

  const updateSubtask = useCallback((index: number, value: string) => {
    setSubtasks((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  }, []);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    if (!title.trim()) return;

    const validation = validateSchedule(dateMode, date, time);
    if (!validation.valid) {
      setScheduleError(validation.message);
      return;
    }
    setScheduleError(undefined);

    const computedDueDate = combineDateAndTime(dateMode, date, time).toISOString();

    if (taskId) {
      updateTask(taskId, {
        title,
        notes: notes || undefined,
        dueDate: computedDueDate,
        timeOfDay: time,
        context,
        energyLevel: energy,
        priority,
        goalId: selectedGoalId,
        financeLink: financeLink !== 'none' ? financeLink : undefined,
        needFocus,
        updatedAt: new Date().toISOString(),
      });
    } else {
      createTask({
        userId: 'current-user',
        title,
        notes: notes || undefined,
        status: 'planned',
        priority,
        dueDate: computedDueDate,
        timeOfDay: time,
        context,
        energyLevel: energy,
        goalId: selectedGoalId,
        financeLink: financeLink !== 'none' ? financeLink : undefined,
        needFocus,
      });
    }

    router.back();
  }, [
    title,
    notes,
    dateMode,
    date,
    time,
    context,
    energy,
    priority,
    selectedGoalId,
    financeLink,
    taskId,
    createTask,
    updateTask,
    router,
  ]);

  const datePickerValue = useMemo(() => {
    if (date) return date;
    return new Date();
  }, [date]);

  const handleDateModePress = useCallback(
    (mode: AddTaskDateMode) => {
      setDateMode(mode);
      if (mode === 'pick') {
        if (Platform.OS === 'android') {
          DateTimePickerAndroid.open({
            value: datePickerValue,
            mode: 'date',
            display: 'calendar',
            onChange: (event, selected) => {
              if (event.type === 'set' && selected) {
                const validation = validateSchedule('pick', selected, time);
                if (!validation.valid) {
                  setScheduleError(validation.message);
                  return;
                }
                setDateMode('pick');
                setDate(selected);
                setScheduleError(undefined);
              }
            },
          });
        } else {
          setShowDatePicker(true);
        }
      } else {
        setDate(undefined);
      }
    },
    [datePickerValue, time],
  );

  const handleSelectDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      const validation = validateSchedule('pick', selectedDate, time);
      if (!validation.valid) {
        setScheduleError(validation.message);
        return;
      }
      setDateMode('pick');
      setDate(selectedDate);
      setScheduleError(undefined);
    }
    setShowDatePicker(false);
  }, [time]);

  const timePickerValue = useMemo(() => {
    const base = new Date();
    base.setSeconds(0);
    base.setMilliseconds(0);
    if (!time) {
      return base;
    }
    const [hours, minutes] = time.split(':');
    base.setHours(parseInt(hours, 10));
    base.setMinutes(parseInt(minutes, 10));
    return base;
  }, [time]);

  const applyTimeSelection = useCallback((selected: Date) => {
    const hours = selected.getHours().toString().padStart(2, '0');
    const minutes = selected.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
  }, []);

  const handleSelectTime = useCallback(
    (event: DateTimePickerEvent, selectedTime?: Date) => {
      if (event.type === 'dismissed') {
        setShowTimePicker(false);
        return;
      }
      if (selectedTime) {
        const validation = validateSchedule(dateMode, date, `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`);
        if (!validation.valid) {
          setScheduleError(validation.message);
          return;
        }
        applyTimeSelection(selectedTime);
        setScheduleError(undefined);
      }
      setShowTimePicker(false);
    },
    [applyTimeSelection, date, dateMode],
  );

  const handleOpenTimeSheet = useCallback(() => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timePickerValue,
        mode: 'time',
        is24Hour: true,
        display: 'clock',
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            const nextTime = `${selected.getHours().toString().padStart(2, '0')}:${selected.getMinutes().toString().padStart(2, '0')}`;
            const validation = validateSchedule(dateMode, date, nextTime);
            if (!validation.valid) {
              setScheduleError(validation.message);
              return;
            }
            applyTimeSelection(selected);
            setScheduleError(undefined);
          }
        },
      });
      return;
    }
    setShowTimePicker(true);
  }, [applyTimeSelection, date, dateMode, timePickerValue]);

  const timeLabel = time ?? addTaskStrings.timePlaceholder;
  useEffect(() => {
    const validation = validateSchedule(dateMode, date, time);
    setScheduleError(validation.valid ? undefined : validation.message);
  }, [date, dateMode, time]);

  const disablePrimary = !title.trim() || Boolean(scheduleError);

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom',"top"]}>
        {/* Header outside KeyboardAvoidingView */}
        <View style={[styles.header, { borderBottomColor: tokens.separator }]}>
          <Text style={[styles.headerTitle, { color: tokens.textSecondary }]}>
            {taskId ? 'Edit Task' : 'Create Task'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={[styles.closeText, { color: tokens.textSecondary }]}>Close</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* Task title */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
                Task title <Text style={{ color: theme.colors.danger ?? '#EF4444' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: tokens.cardItem,
                    borderColor:
                      (!title.trim() && (submitted || titleTouched))
                        ? theme.colors.danger ?? '#EF4444'
                        : tokens.separator,
                  },
                ]}
              >
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setTitleTouched(true)}
                  placeholder="Title"
                  placeholderTextColor={tokens.muted}
                  style={[styles.textInput, { color: tokens.textPrimary }]}
                  autoFocus
                />
              </View>
            </View>

            {/* Goal selection */}
            {goalOptions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: tokens.textSecondary }]}>
                  {addTaskStrings.goalLabel}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.goalScroll}
                >
                  <Pressable onPress={() => setSelectedGoalId(undefined)}>
                    <View
                      style={[
                        styles.goalChip,
                        { backgroundColor: tokens.card, opacity: selectedGoalId ? 0.5 : 1 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.goalChipLabel,
                          { color: selectedGoalId ? tokens.muted : tokens.textPrimary },
                        ]}
                      >
                        {addTaskStrings.goalUnset}
                      </Text>
                    </View>
                  </Pressable>
                  {goalOptions.map((goal) => {
                    const active = goal.id === selectedGoalId;
                    return (
                      <Pressable key={goal.id} onPress={() => setSelectedGoalId(goal.id)}>
                        <View
                          style={[
                            styles.goalChip,
                            { backgroundColor: tokens.card, opacity: active ? 1 : 0.6 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.goalChipLabel,
                              { color: active ? tokens.textPrimary : tokens.muted },
                            ]}
                            numberOfLines={1}
                          >
                            {goal.title}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={[styles.goalHelper, { color: tokens.muted }]}>
                  {addTaskStrings.goalHelper}
                </Text>
              </View>
            )}

            {/* When */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>When</Text>
              <View style={styles.dateRow}>
                {DATE_OPTIONS.map((option) => {
                  const isActive = dateMode === option;
                  const Icon =
                    option === 'today' ? Square : option === 'tomorrow' ? SquareCheck : CalendarDays;
                  const label =
                    option === 'today' ? 'Today' : option === 'tomorrow' ? 'Tomorrow' : 'Pick a date';

                  return (
                    <Pressable
                      key={option}
                      onPress={() => handleDateModePress(option)}
                      style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
                    >
                      <View
                        style={[
                          styles.dateButtonInner,
                          { backgroundColor: isActive ? tokens.card : tokens.cardItem },
                        ]}
                      >
                        <Icon size={20} color={isActive ? tokens.accent : tokens.textSecondary} />
                        <Text
                          style={[
                            styles.dateButtonText,
                            { color: isActive ? tokens.textPrimary : tokens.textSecondary },
                          ]}
                        >
                          {label}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={handleOpenTimeSheet}
                style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
              >
                <View style={[styles.timeButtonInner, { backgroundColor: tokens.cardItem }]}>
                  <Clock4 size={20} color={tokens.textSecondary} />
                  <Text style={[styles.timeButtonText, { color: tokens.textSecondary }]}>
                    {timeLabel}
                  </Text>
                </View>
              </Pressable>
              {scheduleError && (
                <Text style={[styles.errorText, { color: theme.colors.danger ?? '#EF4444' }]}>
                  {scheduleError}
                </Text>
              )}
            </View>

            {/* Description/Notes */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>Description</Text>
              <View style={[styles.descriptionContainer, { backgroundColor: tokens.cardItem }]}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Description (not necessary)"
                  placeholderTextColor={tokens.muted}
                  multiline
                  style={[styles.descriptionInput, { color: tokens.textPrimary }]}
                />
              </View>
            </View>

            {/* Context */}
            <View style={styles.rowField}>
              <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>Context:</Text>
              <Pressable
                style={({ pressed }) => [styles.rowInput, { backgroundColor: tokens.cardItem }, pressed && styles.pressed]}
                onPress={() => {
                  setContextOpen((prev) => !prev);
                  setEnergyOpen(false);
                  setPriorityOpen(false);
                }}
              >
                <AtSign size={18} color={tokens.textSecondary} />
                <Text style={[styles.rowInputText, { color: tokens.textPrimary }]}>
                  {context ?? '@work'}
                </Text>
                <ChevronDown size={16} color={tokens.textSecondary} />
              </Pressable>
            </View>
            {contextOpen && (
              <View style={[styles.dropdown, { backgroundColor: tokens.cardItem, borderColor: tokens.separator }]}>
                {categoryOptions.map((option) => (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      setSelectedCategoryId(option.id as PlannerTaskCategoryId);
                      setContext(option.context);
                      setContextOpen(false);
                    }}
                    style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}
                  >
                    <Text style={[styles.dropdownLabel, { color: tokens.textPrimary }]}>
                      {option.label} ({option.context})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Energy */}
            <View style={styles.rowField}>
              <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>Energy:</Text>
              <Pressable
                style={({ pressed }) => [styles.rowInput, { backgroundColor: tokens.cardItem }, pressed && styles.pressed]}
                onPress={() => {
                  setEnergyOpen((prev) => !prev);
                  setContextOpen(false);
                  setPriorityOpen(false);
                }}
              >
                <Zap size={18} color={tokens.textSecondary} />
                <Text style={[styles.rowInputText, { color: tokens.textPrimary }]}>
                  {energy === 1 ? 'Low' : energy === 2 ? 'Medium' : 'High'}
                </Text>
                <View style={styles.energyIcons}>
                  {[1, 2, 3].map((level) => (
                    <Zap
                      key={level}
                      size={16}
                      color={level <= energy ? tokens.textPrimary : tokens.textSecondary}
                      fill={level <= energy ? tokens.textPrimary : 'none'}
                    />
                  ))}
                </View>
                <ChevronDown size={16} color={tokens.textSecondary} />
              </Pressable>
            </View>
            {energyOpen && (
              <View style={[styles.dropdown, { backgroundColor: tokens.cardItem, borderColor: tokens.separator }]}>
                {[1, 2, 3].map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      setEnergy(level as 1 | 2 | 3);
                      setEnergyOpen(false);
                    }}
                    style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}
                  >
                    <View style={styles.dropdownOptionRow}>
                      {[1, 2, 3].map((iconLevel) => (
                        <Zap
                          key={`${level}-${iconLevel}`}
                          size={14}
                          color={iconLevel <= level ? tokens.accent : tokens.textSecondary}
                          fill={iconLevel <= level ? tokens.accent : 'none'}
                        />
                      ))}
                    </View>
                    <Text style={[styles.dropdownLabel, { color: tokens.textPrimary }]}>
                      {level === 1 ? 'Low' : level === 2 ? 'Medium' : 'High'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Priority */}
            <View style={styles.rowField}>
              <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>Priority:</Text>
              <Pressable
                style={({ pressed }) => [styles.rowInput, { backgroundColor: tokens.cardItem }, pressed && styles.pressed]}
                onPress={() => {
                  setPriorityOpen((prev) => !prev);
                  setContextOpen(false);
                  setEnergyOpen(false);
                }}
              >
                <Flag size={18} color={tokens.textSecondary} />
                <Text style={[styles.rowInputText, { color: tokens.textPrimary }]}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Text>
                <ChevronDown size={16} color={tokens.textSecondary} />
              </Pressable>
            </View>
            {priorityOpen && (
              <View style={[styles.dropdown, { backgroundColor: tokens.cardItem, borderColor: tokens.separator }]}>
                {(['low', 'medium', 'high'] as TaskPriorityLevel[]).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      setPriority(level);
                      setPriorityOpen(false);
                    }}
                    style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}
                  >
                    <Text style={[styles.dropdownLabel, { color: tokens.textPrimary }]}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Finance Link */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
                Finance Action
              </Text>
              <View style={styles.financeLinkGrid}>
                <Pressable
                  onPress={() => setFinanceLink('record_expenses')}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <View
                    style={[
                      styles.financeLinkButton,
                      {
                        backgroundColor:
                          financeLink === 'record_expenses' ? tokens.card : tokens.cardItem,
                        borderWidth: financeLink === 'record_expenses' ? 1.5 : 0,
                        borderColor:
                          financeLink === 'record_expenses' ? tokens.accent : 'transparent',
                      },
                    ]}
                  >
                    <DollarSign
                      size={20}
                      color={
                        financeLink === 'record_expenses' ? tokens.accent : tokens.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        {
                          color:
                            financeLink === 'record_expenses'
                              ? tokens.textPrimary
                              : tokens.textSecondary,
                        },
                      ]}
                    >
                      Record expenses
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setFinanceLink('pay_debt')}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <View
                    style={[
                      styles.financeLinkButton,
                      {
                        backgroundColor: financeLink === 'pay_debt' ? tokens.card : tokens.cardItem,
                        borderWidth: financeLink === 'pay_debt' ? 1.5 : 0,
                        borderColor: financeLink === 'pay_debt' ? tokens.accent : 'transparent',
                      },
                    ]}
                  >
                    <CreditCard
                      size={20}
                      color={financeLink === 'pay_debt' ? tokens.accent : tokens.textSecondary}
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        {
                          color:
                            financeLink === 'pay_debt' ? tokens.textPrimary : tokens.textSecondary,
                        },
                      ]}
                    >
                      Pay debt
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setFinanceLink('review_budget')}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <View
                    style={[
                      styles.financeLinkButton,
                      {
                        backgroundColor:
                          financeLink === 'review_budget' ? tokens.card : tokens.cardItem,
                        borderWidth: financeLink === 'review_budget' ? 1.5 : 0,
                        borderColor: financeLink === 'review_budget' ? tokens.accent : 'transparent',
                      },
                    ]}
                  >
                    <PieChart
                      size={20}
                      color={financeLink === 'review_budget' ? tokens.accent : tokens.textSecondary}
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        {
                          color:
                            financeLink === 'review_budget'
                              ? tokens.textPrimary
                              : tokens.textSecondary,
                        },
                      ]}
                    >
                      Review budget
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setFinanceLink('transfer_money')}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <View
                    style={[
                      styles.financeLinkButton,
                      {
                        backgroundColor:
                          financeLink === 'transfer_money' ? tokens.card : tokens.cardItem,
                        borderWidth: financeLink === 'transfer_money' ? 1.5 : 0,
                        borderColor:
                          financeLink === 'transfer_money' ? tokens.accent : 'transparent',
                      },
                    ]}
                  >
                    <ArrowLeftRight
                      size={20}
                      color={
                        financeLink === 'transfer_money' ? tokens.accent : tokens.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        {
                          color:
                            financeLink === 'transfer_money'
                              ? tokens.textPrimary
                              : tokens.textSecondary,
                        },
                      ]}
                    >
                      Transfer money
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setFinanceLink('none')}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <View
                    style={[
                      styles.financeLinkButton,
                      {
                        backgroundColor: financeLink === 'none' ? tokens.card : tokens.cardItem,
                        borderWidth: financeLink === 'none' ? 1.5 : 0,
                        borderColor: financeLink === 'none' ? tokens.accent : 'transparent',
                      },
                    ]}
                  >
                    <X size={20} color={financeLink === 'none' ? tokens.accent : tokens.textSecondary} />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        {
                          color:
                            financeLink === 'none' ? tokens.textPrimary : tokens.textSecondary,
                        },
                      ]}
                    >
                      None
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Additional */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>Additional</Text>

              {/* Reminder */}
              <View style={[styles.switchRow, { backgroundColor: tokens.cardItem }]}>
                <View style={styles.switchLeft}>
                  <Bell size={18} color={tokens.textSecondary} />
                  <Text style={[styles.switchLabel, { color: tokens.textSecondary }]}>
                    Reminder before
                  </Text>
                </View>
                <View style={styles.switchRight}>
                  <Text style={[styles.switchValue, { color: tokens.textSecondary }]}>
                    ({remindBeforeMin} min)
                  </Text>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ true: tokens.accent, false: tokens.separator }}
                    thumbColor={tokens.card}
                    ios_backgroundColor={tokens.separator}
                  />
                </View>
              </View>

              {/* Repeat */}
              <View style={[styles.switchRow, { backgroundColor: tokens.cardItem }]}>
                <View style={styles.switchLeft}>
                  <Repeat size={18} color={tokens.textSecondary} />
                  <Text style={[styles.switchLabel, { color: tokens.textSecondary }]}>
                    Repeat
                  </Text>
                </View>
                <View style={styles.switchRight}>
                  <Text style={[styles.switchValue, { color: tokens.textSecondary }]}>
                    ({repeatRule})
                  </Text>
                  <Switch
                    value={repeatEnabled}
                    onValueChange={setRepeatEnabled}
                    trackColor={{ true: tokens.accent, false: tokens.separator }}
                    thumbColor={tokens.card}
                    ios_backgroundColor={tokens.separator}
                  />
                </View>
              </View>

              {/* Need FOCUS */}
              <View style={[styles.switchRow, { backgroundColor: tokens.cardItem }]}>
                <View style={styles.switchLeft}>
                  <Heart size={18} color={tokens.textSecondary} />
                  <Text style={[styles.switchLabel, { color: tokens.textSecondary }]}>
                    Need FOCUS
                  </Text>
                </View>
                <Switch
                  value={needFocus}
                  onValueChange={setNeedFocus}
                  trackColor={{ true: tokens.accent, false: tokens.separator }}
                  thumbColor={tokens.card}
                  ios_backgroundColor={tokens.separator}
                />
              </View>

              {/* Subtasks */}
              <Pressable
                onPress={() => setSubtasksOpen((prev) => !prev)}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <View style={[styles.switchRow, { backgroundColor: tokens.cardItem }]}>
                  <View style={styles.switchLeft}>
                    <List size={18} color={tokens.textSecondary} />
                    <Text style={[styles.switchLabel, { color: tokens.textSecondary }]}>
                      Subtasks:
                    </Text>
                  </View>
                  <ChevronDown size={18} color={tokens.textSecondary} />
                </View>
              </Pressable>

              {subtasksOpen && (
                <View style={styles.subtasksList}>
                  {subtasks.map((value, index) => (
                    <View
                      key={`subtask-${index}`}
                      style={[styles.subtaskInput, { backgroundColor: tokens.cardItem }]}
                    >
                      <TextInput
                        value={value}
                        onChangeText={(textValue) => updateSubtask(index, textValue)}
                        placeholder={addTaskStrings.subtaskPlaceholder}
                        placeholderTextColor={tokens.muted}
                        style={[styles.textInput, { color: tokens.textPrimary }]}
                      />
                    </View>
                  ))}
                  <Pressable
                    onPress={addSubtask}
                    style={({ pressed }) => [pressed && styles.pressed]}
                  >
                    <View style={[styles.subtaskAddButton, { backgroundColor: tokens.cardItem }]}>
                      <Plus size={16} color={tokens.accent} />
                      <Text style={{ color: tokens.accent, fontSize: 13, fontWeight: '600' }}>
                        {addTaskStrings.subtaskPlaceholder}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              >
                <Text style={[styles.secondaryButtonText, { color: tokens.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                disabled={disablePrimary}
                onPress={handleSubmit}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && !disablePrimary && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.primaryButtonInner,
                    {
                      backgroundColor: disablePrimary ? tokens.cardItem : tokens.accent,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: disablePrimary ? tokens.textSecondary : '#FFFFFF' },
                    ]}
                  >
                    {taskId ? 'Update' : 'Create'} task
                  </Text>
                </View>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Time Picker Modal (iOS) */}
      {Platform.OS === 'ios' && showTimePicker && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerModal}>
            <Pressable
              style={styles.timePickerBackdrop}
              onPress={() => setShowTimePicker(false)}
            />
            <View style={[styles.timePickerCard, { backgroundColor: tokens.cardItem }]}>
              <DateTimePicker
                value={timePickerValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleSelectTime}
              />
              <Pressable
                style={styles.timePickerDoneButton}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={[styles.timePickerDoneText, { color: tokens.accent }]}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker Modal (iOS) */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent
          visible
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.timePickerModal}>
            <Pressable
              style={styles.timePickerBackdrop}
              onPress={() => setShowDatePicker(false)}
            />
            <View style={[styles.timePickerCard, { backgroundColor: tokens.cardItem }]}>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display="inline"
                onChange={handleSelectDate}
              />
              <Pressable
                style={styles.timePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.timePickerDoneText, { color: tokens.accent }]}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeText: {
    fontSize: 15,
    fontWeight: '500',
  },
  fieldSection: {
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    borderRadius: 16,
  },
  dateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '400',
  },
  timeButton: {
    borderRadius: 16,
  },
  timeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '400',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
  },
  descriptionInput: {
    fontSize: 15,
    fontWeight: '400',
    textAlignVertical: 'top',
  },
  rowField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '400',
    width: 70,
  },
  rowInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  rowInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
  },
  energyIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  dropdown: {
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownOptionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  switchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchValue: {
    fontSize: 13,
    fontWeight: '400',
  },
  subtasksList: {
    marginTop: 8,
    gap: 10,
  },
  subtaskInput: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  subtaskAddButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  section: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  goalScroll: {
    gap: 10,
    paddingVertical: 6,
  },
  goalChip: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 120,
    marginRight: 10,
  },
  goalChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  goalHelper: {
    marginTop: 6,
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '400',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
  },
  primaryButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  timePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  timePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  timePickerCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  timePickerDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  timePickerDoneText: {
    fontSize: 15,
    fontWeight: '600',
  },
  financeLinkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  financeLinkButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 110,
  },
  financeLinkLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
