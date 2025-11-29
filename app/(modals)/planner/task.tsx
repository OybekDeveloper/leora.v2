/* eslint-disable react/no-unescaped-entities */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  Check,
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
import { Dropdown } from 'react-native-element-dropdown';

import { createThemedStyles, useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
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
  const styles = useStyles();
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
  const [financeLink, setFinanceLink] = useState<TaskFinanceLink>('none');

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [remindBeforeMin] = useState<number>(15);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatRule] = useState<string | undefined>('Everyday');
  const [needFocus, setNeedFocus] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);

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

  useEffect(() => {
    if (!categoryOptions.some((option) => option.id === selectedCategoryId)) {
      setSelectedCategoryId(defaultCategoryId);
    }
  }, [categoryOptions, defaultCategoryId, selectedCategoryId]);

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
    needFocus,
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
      <SafeAreaView style={styles.container} edges={['bottom','top']}>
        {/* Header outside KeyboardAvoidingView */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {taskId ? 'Edit Task' : 'Create Task'}
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.closeText}>Close</Text>
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
              <Text style={styles.fieldLabel}>
                Task title <Text style={styles.required}>*</Text>
              </Text>
              <AdaptiveGlassView
                style={[
                  styles.inputContainer,
                  (!title.trim() && (submitted || titleTouched)) && styles.inputError,
                ]}
              >
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  onBlur={() => setTitleTouched(true)}
                  placeholder="Title"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                  autoFocus
                />
              </AdaptiveGlassView>
            </View>

            {/* Goal selection */}
            {goalOptions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {addTaskStrings.goalLabel}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.goalScroll}
                >
                  <Pressable onPress={() => setSelectedGoalId(undefined)}>
                    <AdaptiveGlassView
                      style={[
                        styles.goalChip,
                        !selectedGoalId && styles.goalChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.goalChipLabel,
                          !selectedGoalId && styles.goalChipLabelActive,
                        ]}
                      >
                        {addTaskStrings.goalUnset}
                      </Text>
                    </AdaptiveGlassView>
                  </Pressable>
                  {goalOptions.map((goal) => {
                    const active = goal.id === selectedGoalId;
                    return (
                      <Pressable key={goal.id} onPress={() => setSelectedGoalId(goal.id)}>
                        <AdaptiveGlassView
                          style={[
                            styles.goalChip,
                            active && styles.goalChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.goalChipLabel,
                              active && styles.goalChipLabelActive,
                            ]}
                            numberOfLines={1}
                          >
                            {goal.title}
                          </Text>
                        </AdaptiveGlassView>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Text style={styles.goalHelper}>
                  {addTaskStrings.goalHelper}
                </Text>
              </View>
            )}

            {/* When */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>When</Text>
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
                      style={styles.dateButton}
                    >
                      <AdaptiveGlassView
                        style={[
                          styles.dateButtonInner,
                          isActive && styles.dateButtonActive,
                        ]}
                      >
                        <Icon size={20} color={isActive ? theme.colors.primary : theme.colors.textSecondary} />
                        <Text
                          style={[
                            styles.dateButtonText,
                            isActive && styles.dateButtonTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </AdaptiveGlassView>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={handleOpenTimeSheet}>
                <AdaptiveGlassView style={styles.timeButtonInner}>
                  <Clock4 size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.timeButtonText}>
                    {timeLabel}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
              {scheduleError && (
                <Text style={styles.errorText}>
                  {scheduleError}
                </Text>
              )}
            </View>

            {/* Description/Notes */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Description</Text>
              <AdaptiveGlassView style={styles.descriptionContainer}>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Description (not necessary)"
                  placeholderTextColor={theme.colors.textMuted}
                  multiline
                  style={styles.descriptionInput}
                />
              </AdaptiveGlassView>
            </View>

            {/* Context */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Context</Text>
              <Dropdown
                mode="default"
                data={categoryOptions}
                labelField="label"
                valueField="context"
                value={context}
                onChange={(item) => {
                  setSelectedCategoryId(item.id as PlannerTaskCategoryId);
                  setContext(item.context);
                }}
                style={styles.dropdown}
                containerStyle={[styles.dropdownContainer, { backgroundColor: theme.colors.card }]}
                itemContainerStyle={styles.dropdownItemContainer}
                renderLeftIcon={() => (
                  <AtSign size={18} color={theme.colors.textSecondary} style={{ marginRight: 10 }} />
                )}
                renderItem={(item) => {
                  const active = item.context === context;
                  return (
                    <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
                      <AtSign size={16} color={active ? theme.colors.primary : theme.colors.textSecondary} />
                      <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.dropdownItemContext, active && styles.dropdownItemLabelActive]}>
                        {item.context}
                      </Text>
                      {active && <Check size={16} color={theme.colors.primary} />}
                    </View>
                  );
                }}
                renderRightIcon={() => (
                  <ChevronDown size={18} color={theme.colors.textSecondary} />
                )}
                activeColor={theme.colors.cardItem}
                selectedTextStyle={styles.dropdownSelectedText}
                placeholderStyle={styles.dropdownPlaceholder}
              />
            </View>

            {/* Energy */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Energy Level</Text>
              <Dropdown
                mode="default"
                data={[
                  { value: 1, label: 'Low' },
                  { value: 2, label: 'Medium' },
                  { value: 3, label: 'High' },
                ]}
                labelField="label"
                valueField="value"
                value={energy}
                onChange={(item) => setEnergy(item.value as 1 | 2 | 3)}
                style={styles.dropdown}
                containerStyle={[styles.dropdownContainer, { backgroundColor: theme.colors.card }]}
                itemContainerStyle={styles.dropdownItemContainer}
                renderLeftIcon={() => (
                  <View style={[styles.energyIconsRow, { marginRight: 10 }]}>
                    {[1, 2, 3].map((level) => (
                      <Zap
                        key={level}
                        size={16}
                        color={level <= energy ? theme.colors.warning : theme.colors.textMuted}
                        fill={level <= energy ? theme.colors.warning : 'none'}
                      />
                    ))}
                  </View>
                )}
                renderItem={(item) => {
                  const active = item.value === energy;
                  return (
                    <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
                      <View style={styles.energyIconsRow}>
                        {[1, 2, 3].map((iconLevel) => (
                          <Zap
                            key={iconLevel}
                            size={14}
                            color={iconLevel <= item.value ? (active ? theme.colors.primary : theme.colors.warning) : theme.colors.textMuted}
                            fill={iconLevel <= item.value ? (active ? theme.colors.primary : theme.colors.warning) : 'none'}
                          />
                        ))}
                      </View>
                      <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
                        {item.label}
                      </Text>
                      {active && <Check size={16} color={theme.colors.primary} />}
                    </View>
                  );
                }}
                renderRightIcon={() => (
                  <ChevronDown size={18} color={theme.colors.textSecondary} />
                )}
                activeColor={theme.colors.cardItem}
                selectedTextStyle={styles.dropdownSelectedText}
                placeholderStyle={styles.dropdownPlaceholder}
              />
            </View>

            {/* Priority */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Priority</Text>
              <Dropdown
                mode="default"
                data={[
                  { value: 'low' as TaskPriorityLevel, label: 'Low' },
                  { value: 'medium' as TaskPriorityLevel, label: 'Medium' },
                  { value: 'high' as TaskPriorityLevel, label: 'High' },
                ]}
                labelField="label"
                valueField="value"
                value={priority}
                onChange={(item) => setPriority(item.value)}
                style={styles.dropdown}
                containerStyle={[styles.dropdownContainer, { backgroundColor: theme.colors.card }]}
                itemContainerStyle={styles.dropdownItemContainer}
                renderLeftIcon={() => (
                  <Flag
                    size={18}
                    color={
                      priority === 'high' ? theme.colors.danger :
                      priority === 'medium' ? theme.colors.warning :
                      theme.colors.textSecondary
                    }
                    style={{ marginRight: 10 }}
                  />
                )}
                renderItem={(item) => {
                  const active = item.value === priority;
                  const flagColor = item.value === 'high' ? theme.colors.danger :
                                   item.value === 'medium' ? theme.colors.warning :
                                   theme.colors.textSecondary;
                  return (
                    <View style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
                      <Flag size={16} color={active ? theme.colors.primary : flagColor} />
                      <Text style={[styles.dropdownItemLabel, active && styles.dropdownItemLabelActive]}>
                        {item.label}
                      </Text>
                      {active && <Check size={16} color={theme.colors.primary} />}
                    </View>
                  );
                }}
                renderRightIcon={() => (
                  <ChevronDown size={18} color={theme.colors.textSecondary} />
                )}
                activeColor={theme.colors.cardItem}
                selectedTextStyle={styles.dropdownSelectedText}
                placeholderStyle={styles.dropdownPlaceholder}
              />
            </View>

            {/* Finance Link */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>
                Finance Action
              </Text>
              <View style={styles.financeLinkGrid}>
                <Pressable onPress={() => setFinanceLink('record_expenses')}>
                  <AdaptiveGlassView
                    style={[
                      styles.financeLinkButton,
                      financeLink === 'record_expenses' && styles.financeLinkButtonActive,
                    ]}
                  >
                    <DollarSign
                      size={20}
                      color={financeLink === 'record_expenses' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        financeLink === 'record_expenses' && styles.financeLinkLabelActive,
                      ]}
                    >
                      Record expenses
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>

                <Pressable onPress={() => setFinanceLink('pay_debt')}>
                  <AdaptiveGlassView
                    style={[
                      styles.financeLinkButton,
                      financeLink === 'pay_debt' && styles.financeLinkButtonActive,
                    ]}
                  >
                    <CreditCard
                      size={20}
                      color={financeLink === 'pay_debt' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        financeLink === 'pay_debt' && styles.financeLinkLabelActive,
                      ]}
                    >
                      Pay debt
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>

                <Pressable onPress={() => setFinanceLink('review_budget')}>
                  <AdaptiveGlassView
                    style={[
                      styles.financeLinkButton,
                      financeLink === 'review_budget' && styles.financeLinkButtonActive,
                    ]}
                  >
                    <PieChart
                      size={20}
                      color={financeLink === 'review_budget' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        financeLink === 'review_budget' && styles.financeLinkLabelActive,
                      ]}
                    >
                      Review budget
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>

                <Pressable onPress={() => setFinanceLink('transfer_money')}>
                  <AdaptiveGlassView
                    style={[
                      styles.financeLinkButton,
                      financeLink === 'transfer_money' && styles.financeLinkButtonActive,
                    ]}
                  >
                    <ArrowLeftRight
                      size={20}
                      color={financeLink === 'transfer_money' ? theme.colors.primary : theme.colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        financeLink === 'transfer_money' && styles.financeLinkLabelActive,
                      ]}
                    >
                      Transfer money
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>

                <Pressable onPress={() => setFinanceLink('none')}>
                  <AdaptiveGlassView
                    style={[
                      styles.financeLinkButton,
                      financeLink === 'none' && styles.financeLinkButtonActive,
                    ]}
                  >
                    <X size={20} color={financeLink === 'none' ? theme.colors.primary : theme.colors.textSecondary} />
                    <Text
                      style={[
                        styles.financeLinkLabel,
                        financeLink === 'none' && styles.financeLinkLabelActive,
                      ]}
                    >
                      None
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>
              </View>
            </View>

            {/* Additional */}
            <View style={styles.fieldSection}>
              <Text style={styles.fieldLabel}>Additional</Text>

              {/* Reminder */}
              <AdaptiveGlassView style={styles.switchRow}>
                <View style={styles.switchLeft}>
                  <Bell size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.switchLabel}>
                    Reminder before
                  </Text>
                </View>
                <View style={styles.switchRight}>
                  <Text style={styles.switchValue}>
                    ({remindBeforeMin} min)
                  </Text>
                  <Switch
                    value={reminderEnabled}
                    onValueChange={setReminderEnabled}
                    trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </AdaptiveGlassView>

              {/* Repeat */}
              <AdaptiveGlassView style={styles.switchRow}>
                <View style={styles.switchLeft}>
                  <Repeat size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.switchLabel}>
                    Repeat
                  </Text>
                </View>
                <View style={styles.switchRight}>
                  <Text style={styles.switchValue}>
                    ({repeatRule})
                  </Text>
                  <Switch
                    value={repeatEnabled}
                    onValueChange={setRepeatEnabled}
                    trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </AdaptiveGlassView>

              {/* Need FOCUS */}
              <AdaptiveGlassView style={styles.switchRow}>
                <View style={styles.switchLeft}>
                  <Heart size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.switchLabel}>
                    Need FOCUS
                  </Text>
                </View>
                <Switch
                  value={needFocus}
                  onValueChange={setNeedFocus}
                  trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
                  thumbColor="#FFFFFF"
                />
              </AdaptiveGlassView>

              {/* Subtasks */}
              <Pressable onPress={() => setSubtasksOpen((prev) => !prev)}>
                <AdaptiveGlassView style={styles.switchRow}>
                  <View style={styles.switchLeft}>
                    <List size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.switchLabel}>
                      Subtasks:
                    </Text>
                  </View>
                  <ChevronDown size={18} color={theme.colors.textSecondary} />
                </AdaptiveGlassView>
              </Pressable>

              {subtasksOpen && (
                <View style={styles.subtasksList}>
                  {subtasks.map((value, index) => (
                    <AdaptiveGlassView
                      key={`subtask-${index}`}
                      style={styles.subtaskInput}
                    >
                      <TextInput
                        value={value}
                        onChangeText={(textValue) => updateSubtask(index, textValue)}
                        placeholder={addTaskStrings.subtaskPlaceholder}
                        placeholderTextColor={theme.colors.textMuted}
                        style={styles.textInput}
                      />
                    </AdaptiveGlassView>
                  ))}
                  <Pressable onPress={addSubtask}>
                    <AdaptiveGlassView style={styles.subtaskAddButton}>
                      <Plus size={16} color={theme.colors.primary} />
                      <Text style={styles.subtaskAddText}>
                        {addTaskStrings.subtaskPlaceholder}
                      </Text>
                    </AdaptiveGlassView>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => router.back()}
                style={styles.secondaryButton}
              >
                <AdaptiveGlassView style={styles.secondaryButtonInner}>
                  <Text style={styles.secondaryButtonText}>
                    Cancel
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
              <Pressable
                disabled={disablePrimary}
                onPress={handleSubmit}
                style={[
                  styles.primaryButton,
                  disablePrimary && styles.primaryButtonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {taskId ? 'Update' : 'Create'} task
                </Text>
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
            <View style={styles.timePickerCard}>
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
                <Text style={styles.timePickerDoneText}>Done</Text>
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
            <View style={styles.timePickerCard}>
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
                <Text style={styles.timePickerDoneText}>Done</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const useStyles = createThemedStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  closeText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  fieldSection: {
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  required: {
    color: theme.colors.danger,
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  textInput: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.textPrimary,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
  },
  dateButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  dateButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  dateButtonTextActive: {
    color: theme.colors.primary,
  },
  timeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  timeButtonText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  descriptionContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  descriptionInput: {
    fontSize: 15,
    fontWeight: '400',
    textAlignVertical: 'top',
    color: theme.colors.textPrimary,
  },
  energyIconsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dropdown: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  dropdownContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownItemActive: {
    backgroundColor: theme.colors.cardItem,
  },
  dropdownItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  dropdownItemLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dropdownItemContext: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  dropdownSelectedText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.textMuted,
  },
  dropdownItemContainer: {
    padding: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  switchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchValue: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  subtasksList: {
    marginTop: 8,
    gap: 10,
  },
  subtaskInput: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subtaskAddButton: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  subtaskAddText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
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
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  goalChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  goalChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  goalChipLabelActive: {
    color: theme.colors.primary,
  },
  goalHelper: {
    marginTop: 6,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flex: 1,
  },
  secondaryButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.textSecondary,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  timePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  timePickerCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.card,
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
    color: theme.colors.primary,
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
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  financeLinkButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}15`,
  },
  financeLinkLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  financeLinkLabelActive: {
    color: theme.colors.primary,
  },
}));
