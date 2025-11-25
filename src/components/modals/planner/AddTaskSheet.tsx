/* eslint-disable react/no-unescaped-entities */
// components/modals/planner/AddTaskSheet.tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Easing } from 'react-native-reanimated';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
  FolderClosed,
  Heart,
  Lightbulb,
  List,
  PieChart,
  Plus,
  Repeat,
  Square,
  SquareCheck,
  X,
  Zap,
} from 'lucide-react-native';

import CustomBottomSheet, {
  BottomSheetHandle,
} from '@/components/modals/BottomSheet';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { useAppTheme } from '@/constants/theme';
import { useLocalization } from '@/localization/useLocalization';
import type {
  AddTaskDateMode,
  AddTaskPayload,
  PlannerTaskCategoryId,
  TaskEnergyLevel,
  TaskFinanceLink,
  TaskPriorityLevel,
} from '@/types/planner';
import { usePlannerDomainStore } from '@/stores/usePlannerDomainStore';

const CATEGORY_PRESETS: { id: PlannerTaskCategoryId; context: string }[] = [
  { id: 'work', context: '@work' },
  { id: 'personal', context: '@home' },
  { id: 'health', context: '@health' },
  { id: 'learning', context: '@learning' },
  { id: 'errands', context: '@city' },
] as const;

const DATE_OPTIONS: AddTaskDateMode[] = ['today', 'tomorrow', 'pick'];

export interface AddTaskSheetHandle {
  open: () => void;
  close: () => void;
  edit: (initial: Partial<AddTaskPayload>, options?: { taskId?: string }) => void;
}

type AddTaskSheetProps = {
  onCreate?: (payload: AddTaskPayload, options?: { keepOpen?: boolean; editingTaskId?: string }) => void;
  onDismiss?: () => void;
};

const AddTaskSheetComponent = (
  { onCreate, onDismiss }: AddTaskSheetProps,
  ref: React.Ref<AddTaskSheetHandle>,
) => {
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const addTaskStrings = strings.addTask;

  const sheetRef = useRef<BottomSheetHandle>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
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

  // ---- form state
  const [title, setTitle] = useState('');
  const [dateMode, setDateMode] = useState<AddTaskDateMode>('tomorrow');
  const [date, setDate] = useState<string | undefined>(undefined);
  const [time, setTime] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState('');

  const [project, setProject] = useState<string | undefined>(undefined);
  const [context, setContext] = useState<string | undefined>(CATEGORY_PRESETS[0].context);
  const [energy, setEnergy] = useState<TaskEnergyLevel>('medium');
  const [priority, setPriority] = useState<TaskPriorityLevel>('medium');
  const [selectedCategoryId, setSelectedCategoryId] = useState<PlannerTaskCategoryId>(defaultCategoryId);
  const [selectedGoalId, setSelectedGoalId] = useState<string | undefined>(undefined);
  const [financeLink, setFinanceLink] = useState<TaskFinanceLink>('none');

  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [remindBeforeMin, setRemindBeforeMin] = useState<number>(15);
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatRule, setRepeatRule] = useState<string | undefined>('Everyday');
  const [needFocus, setNeedFocus] = useState(false);

  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const [subtasks, setSubtasks] = useState<string[]>([]);

  const domainGoals = usePlannerDomainStore((state) => state.goals);
  const goalOptions = useMemo(
    () =>
      domainGoals.map((goal) => ({
        id: goal.id,
        title: goal.title,
      })),
    [domainGoals],
  );


  useEffect(() => {
    if (!categoryOptions.some((option) => option.id === selectedCategoryId)) {
      setSelectedCategoryId(defaultCategoryId);
    }
  }, [categoryOptions, defaultCategoryId, selectedCategoryId]);

  const snapPoints = useMemo<(string | number)[]>(() => ['78%', '96%'], []);

  const open = useCallback(() => sheetRef.current?.present(), []);
  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  const selectCategoryByContext = useCallback(
    (value?: string) => {
      const match = categoryOptions.find((option) => option.context === value);
      setSelectedCategoryId(match?.id ?? defaultCategoryId);
    },
    [categoryOptions, defaultCategoryId],
  );

  const edit = useCallback(
    (initial: Partial<AddTaskPayload>, options?: { taskId?: string }) => {
      setEditingTaskId(options?.taskId ?? null);
      setShowDatePicker(false);
      setShowTimePicker(false);
      setTitle(initial.title ?? '');
      setDateMode((initial.dateMode as AddTaskDateMode) ?? 'tomorrow');
      setDate(initial.date);
      setTime(initial.time);
      setDescription(initial.description ?? '');
      setProject(initial.project);
      setContext(initial.context ?? CATEGORY_PRESETS[0].context);
      selectCategoryByContext(initial.context ?? CATEGORY_PRESETS[0].context);
      setSelectedGoalId(initial.goalId ?? undefined);
      setFinanceLink(initial.financeLink ?? 'none');
      setEnergy(initial.energy ?? 'medium');
      setPriority(initial.priority ?? 'medium');
      setReminderEnabled(initial.reminderEnabled ?? true);
      setRemindBeforeMin(initial.remindBeforeMin ?? 15);
      setRepeatEnabled(initial.repeatEnabled ?? false);
      setRepeatRule(initial.repeatRule ?? 'Everyday');
      setNeedFocus(initial.needFocus ?? false);
      setSubtasks(initial.subtasks ?? []);
      open();
    },
    [open, selectCategoryByContext],
  );

  useImperativeHandle(ref, () => ({ open, close, edit }), [open, close, edit]);

  const addSubtask = useCallback(() => {
    setSubtasks((prev) => [...prev, '']);
  }, []);

  const updateSubtask = useCallback((index: number, value: string) => {
    setSubtasks((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  }, []);


  const buildPayload = useCallback(
    (): AddTaskPayload => ({
      title,
      dateMode,
      date,
      time,
      description,
      project,
      context,
      energy,
      priority,
      categoryId: selectedCategoryId,
      goalId: selectedGoalId,
      financeLink: financeLink !== 'none' ? financeLink : undefined,
      reminderEnabled,
      remindBeforeMin,
      repeatEnabled,
      repeatRule,
      needFocus,
      subtasks,
    }),
    [
      context,
      date,
      dateMode,
      description,
      energy,
      financeLink,
      needFocus,
      priority,
      project,
      reminderEnabled,
      remindBeforeMin,
      repeatEnabled,
      repeatRule,
      selectedCategoryId,
      selectedGoalId,
      subtasks,
      time,
      title,
    ],
  );

  const resetForm = useCallback(() => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setTime(undefined);
    setDate(undefined);
    setProject(undefined);
    setContext(CATEGORY_PRESETS[0].context);
    setSelectedCategoryId(defaultCategoryId);
    setSelectedGoalId(undefined);
    setFinanceLink('none');
    setEnergy('medium');
    setPriority('medium');
    setSubtasks([]);
    setNeedFocus(false);
    setRepeatEnabled(false);
    setReminderEnabled(true);
    setRemindBeforeMin(15);
    setDateMode('tomorrow');
    setShowTimePicker(false);
    setShowDatePicker(false);
  }, [defaultCategoryId]);

  const handleCreate = useCallback(
    (keepOpen?: boolean) => {
      const payload = buildPayload();
      onCreate?.(payload, { keepOpen, editingTaskId: editingTaskId ?? undefined });
      if (!keepOpen) {
        close();
        resetForm();
      }
    },
    [buildPayload, close, editingTaskId, onCreate, resetForm],
  );

  const datePickerValue = useMemo(() => {
    if (date) {
      const parsed = new Date(date);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
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
                setDateMode('pick');
                setDate(selected.toISOString());
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
    [datePickerValue],
  );

  const handleSelectDate = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setDateMode('pick');
      setDate(selectedDate.toISOString());
    }
    setShowDatePicker(false);
  }, []);

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

  const handleSelectTime = useCallback((event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (selectedTime) {
      applyTimeSelection(selectedTime);
    }
    setShowTimePicker(false);
  }, [applyTimeSelection]);

  const handleOpenTimeSheet = useCallback(() => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: timePickerValue,
        mode: 'time',
        is24Hour: true,
        display: 'clock',
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            applyTimeSelection(selected);
          }
        },
      });
      return;
    }
    setShowTimePicker(true);
  }, [applyTimeSelection, timePickerValue]);

  const timeLabel = time ?? addTaskStrings.timePlaceholder;
  const disablePrimary = !title.trim();
  const handleSheetDismiss = useCallback(() => {
    setShowTimePicker(false);
    setShowDatePicker(false);
    resetForm();
    onDismiss?.();
  }, [onDismiss, resetForm]);

  return (
    <>
      <CustomBottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        animationConfigs={{ duration: 320, easing: Easing.linear }}
        enableDynamicSizing={false}
        backgroundStyle={[
          styles.sheetBackground,
          {
            backgroundColor:
              theme.mode === 'dark'
                ? 'rgba(18,18,22,0.92)'
                : 'rgba(255,255,255,0.94)',
            borderColor: theme.colors.borderMuted,
          },
        ]}
        handleIndicatorStyle={[
          styles.handleIndicator,
          { backgroundColor: theme.colors.textMuted },
        ]}
        scrollable
        scrollProps={{ keyboardShouldPersistTaps: 'handled' }}
        contentContainerStyle={styles.scrollContent}
        onDismiss={handleSheetDismiss}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: tokens.textSecondary }]}>
            NEW TASK
          </Text>
        </View>

        {/* Task title */}
        <View style={styles.fieldSection}>
          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
            Task title
          </Text>
          <AdaptiveGlassView
            style={[
              styles.inputContainer,
              { backgroundColor: tokens.cardItem },
            ]}
          >
            <BottomSheetTextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={tokens.muted}
              style={[styles.textInput, { color: tokens.textPrimary }]}
            />
          </AdaptiveGlassView>
        </View>

        {goalOptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{addTaskStrings.goalLabel}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.goalScroll}
            >
              <Pressable onPress={() => setSelectedGoalId(undefined)}>
                <AdaptiveGlassView
                  style={[
                    styles.glassSurface,
                    styles.goalChip,
                    { opacity: selectedGoalId ? 0.5 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      styles.goalChipLabel,
                      { color: selectedGoalId ? '#9E9E9E' : '#FFFFFF' },
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
                        styles.glassSurface,
                        styles.goalChip,
                        { opacity: active ? 1 : 0.6 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.goalChipLabel,
                          { color: active ? '#FFFFFF' : '#9E9E9E' },
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
            <Text style={styles.goalHelper}>{addTaskStrings.goalHelper}</Text>
          </View>
        )}

        {/* When */}
        <View style={styles.fieldSection}>
          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
            When
          </Text>
          <View style={styles.dateRow}>
            {DATE_OPTIONS.map((option) => {
              const isActive = dateMode === option;
              const Icon = option === 'today' ? Square : option === 'tomorrow' ? SquareCheck : CalendarDays;
              const label = option === 'today' ? 'Today' : option === 'tomorrow' ? 'Tomorrow' : 'Pick a date';

              return (
                <Pressable
                  key={option}
                  onPress={() => handleDateModePress(option)}
                  style={({ pressed }) => [
                    styles.dateButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <AdaptiveGlassView
                    style={[
                      styles.dateButtonInner,
                      { backgroundColor: isActive ? tokens.card : tokens.cardItem },
                    ]}
                  >
                    <Icon
                      size={20}
                      color={isActive ? tokens.accent : tokens.textSecondary}
                    />
                    <Text
                      style={[
                        styles.dateButtonText,
                        { color: isActive ? tokens.textPrimary : tokens.textSecondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </AdaptiveGlassView>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={handleOpenTimeSheet}
            style={({ pressed }) => [styles.timeButton, pressed && styles.pressed]}
          >
            <AdaptiveGlassView
              style={[
                styles.timeButtonInner,
                { backgroundColor: tokens.cardItem },
              ]}
            >
              <Clock4 size={20} color={tokens.textSecondary} />
              <Text style={[styles.timeButtonText, { color: tokens.textSecondary }]}>
                {timeLabel}
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>

        {/* Description */}
        <View style={styles.fieldSection}>
          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
            Description
          </Text>
          <AdaptiveGlassView
            style={[
              styles.descriptionContainer,
              { backgroundColor: tokens.cardItem },
            ]}
          >
            <BottomSheetTextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (not necessary)"
              placeholderTextColor={tokens.muted}
              multiline
              style={[styles.descriptionInput, { color: tokens.textPrimary }]}
            />
          </AdaptiveGlassView>
        </View>

        {/* Project */}
        <View style={styles.rowField}>
          <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>
            Project:
          </Text>
          <AdaptiveGlassView
            style={[
              styles.rowInput,
              { backgroundColor: tokens.cardItem },
            ]}
          >
            <FolderClosed size={18} color={tokens.textSecondary} />
            <Text style={[styles.rowInputText, { color: tokens.textSecondary }]}>
              {project ?? 'Choose your project'}
            </Text>
          </AdaptiveGlassView>
        </View>

        {/* Context */}
        <View style={styles.rowField}>
          <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>
            Context:
          </Text>
          <AdaptiveGlassView
            style={[
              styles.rowInput,
              { backgroundColor: tokens.cardItem },
            ]}
          >
            <AtSign size={18} color={tokens.textSecondary} />
            <Text style={[styles.rowInputText, { color: tokens.textPrimary }]}>
              {context ?? '@work'}
            </Text>
          </AdaptiveGlassView>
        </View>

        {/* Energy */}
        <View style={styles.rowField}>
          <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>
            Energy:
          </Text>
          <AdaptiveGlassView
            style={[
              styles.rowInput,
              { backgroundColor: tokens.cardItem },
            ]}
          >
            <Zap size={18} color={tokens.textSecondary} />
            <Text style={[styles.rowInputText, { color: tokens.textPrimary }]}>
              Medium
            </Text>
            <View style={styles.energyIcons}>
              {[1, 2, 3].map((level) => (
                <Zap
                  key={level}
                  size={16}
                  color={level <= 2 ? tokens.textPrimary : tokens.textSecondary}
                  fill={level <= 2 ? tokens.textPrimary : 'none'}
                />
              ))}
            </View>
          </AdaptiveGlassView>
        </View>

        {/* Priority */}
        <View style={styles.rowField}>
          <Text style={[styles.rowLabel, { color: tokens.textSecondary }]}>
            Priority:
          </Text>
          <AdaptiveGlassView
            style={[
              styles.rowInput,
              { backgroundColor: tokens.cardItem },
            ]}
          >
            <Flag size={18} color={tokens.textSecondary} />
            <Text style={[styles.rowInputText, { color: tokens.textPrimary }]}>
              Medium
            </Text>
          </AdaptiveGlassView>
        </View>

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
              <AdaptiveGlassView
                style={[
                  styles.financeLinkButton,
                  {
                    backgroundColor:
                      financeLink === 'record_expenses' ? tokens.card : tokens.cardItem,
                    borderWidth: financeLink === 'record_expenses' ? 1.5 : 0,
                    borderColor: financeLink === 'record_expenses' ? tokens.accent : 'transparent',
                  },
                ]}
              >
                <DollarSign
                  size={20}
                  color={financeLink === 'record_expenses' ? tokens.accent : tokens.textSecondary}
                />
                <Text
                  style={[
                    styles.financeLinkLabel,
                    {
                      color:
                        financeLink === 'record_expenses' ? tokens.textPrimary : tokens.textSecondary,
                    },
                  ]}
                >
                  Record expenses
                </Text>
              </AdaptiveGlassView>
            </Pressable>

            <Pressable
              onPress={() => setFinanceLink('pay_debt')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AdaptiveGlassView
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
                    { color: financeLink === 'pay_debt' ? tokens.textPrimary : tokens.textSecondary },
                  ]}
                >
                  Pay debt
                </Text>
              </AdaptiveGlassView>
            </Pressable>

            <Pressable
              onPress={() => setFinanceLink('review_budget')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AdaptiveGlassView
                style={[
                  styles.financeLinkButton,
                  {
                    backgroundColor: financeLink === 'review_budget' ? tokens.card : tokens.cardItem,
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
                        financeLink === 'review_budget' ? tokens.textPrimary : tokens.textSecondary,
                    },
                  ]}
                >
                  Review budget
                </Text>
              </AdaptiveGlassView>
            </Pressable>

            <Pressable
              onPress={() => setFinanceLink('transfer_money')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AdaptiveGlassView
                style={[
                  styles.financeLinkButton,
                  {
                    backgroundColor:
                      financeLink === 'transfer_money' ? tokens.card : tokens.cardItem,
                    borderWidth: financeLink === 'transfer_money' ? 1.5 : 0,
                    borderColor: financeLink === 'transfer_money' ? tokens.accent : 'transparent',
                  },
                ]}
              >
                <ArrowLeftRight
                  size={20}
                  color={financeLink === 'transfer_money' ? tokens.accent : tokens.textSecondary}
                />
                <Text
                  style={[
                    styles.financeLinkLabel,
                    {
                      color:
                        financeLink === 'transfer_money' ? tokens.textPrimary : tokens.textSecondary,
                    },
                  ]}
                >
                  Transfer money
                </Text>
              </AdaptiveGlassView>
            </Pressable>

            <Pressable
              onPress={() => setFinanceLink('none')}
              style={({ pressed }) => [pressed && styles.pressed]}
            >
              <AdaptiveGlassView
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
                    { color: financeLink === 'none' ? tokens.textPrimary : tokens.textSecondary },
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
          <Text style={[styles.fieldLabel, { color: tokens.textSecondary }]}>
            Additional
          </Text>

          {/* Reminder */}
          <AdaptiveGlassView
            style={[
              styles.switchRow,
              { backgroundColor: tokens.cardItem },
            ]}
          >
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
          </AdaptiveGlassView>

          {/* Repeat */}
          <AdaptiveGlassView
            style={[
              styles.switchRow,
              { backgroundColor: tokens.cardItem },
            ]}
          >
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
          </AdaptiveGlassView>

          {/* Need FOCUS */}
          <AdaptiveGlassView
            style={[
              styles.switchRow,
              { backgroundColor: tokens.cardItem },
            ]}
          >
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
          </AdaptiveGlassView>

          {/* Subtasks */}
          <Pressable
            onPress={() => setSubtasksOpen((prev) => !prev)}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <AdaptiveGlassView
              style={[
                styles.switchRow,
                { backgroundColor: tokens.cardItem },
              ]}
            >
              <View style={styles.switchLeft}>
                <List size={18} color={tokens.textSecondary} />
                <Text style={[styles.switchLabel, { color: tokens.textSecondary }]}>
                  Subtasks:
                </Text>
              </View>
              <ChevronDown size={18} color={tokens.textSecondary} />
            </AdaptiveGlassView>
          </Pressable>

          {subtasksOpen && (
            <View style={styles.subtasksList}>
              {subtasks.map((value, index) => (
                <AdaptiveGlassView
                  key={`subtask-${index}`}
                  style={[
                    styles.subtaskInput,
                    { backgroundColor: tokens.cardItem },
                  ]}
                >
                  <BottomSheetTextInput
                    value={value}
                    onChangeText={(textValue) => updateSubtask(index, textValue)}
                    placeholder={addTaskStrings.subtaskPlaceholder}
                    placeholderTextColor={tokens.muted}
                    style={[styles.textInput, { color: tokens.textPrimary }]}
                  />
                </AdaptiveGlassView>
              ))}
              <Pressable
                onPress={addSubtask}
                style={({ pressed }) => [pressed && styles.pressed]}
              >
                <AdaptiveGlassView
                  style={[
                    styles.subtaskAddButton,
                    { backgroundColor: tokens.cardItem },
                  ]}
                >
                  <Plus size={16} color={tokens.accent} />
                  <Text style={{ color: tokens.accent, fontSize: 13, fontWeight: '600' }}>
                    {addTaskStrings.subtaskPlaceholder}
                  </Text>
                </AdaptiveGlassView>
              </Pressable>
            </View>
          )}
        </View>

        {/* AI Suggestions */}
        <View style={styles.aiSuggestion}>
          <Lightbulb size={22} color="#FFA500" />
          <View style={styles.aiTextContainer}>
            <Text style={[styles.aiText, { color: tokens.textSecondary }]}>
              AI:{' '}
              <Text style={{ color: tokens.textPrimary }}>
                "At the current pace, you will reach your goal in March. If you increase contributions by 100k per month
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.aiSuggestion}>
          <Lightbulb size={22} color="#FFA500" />
          <View style={styles.aiTextContainer}>
            <Text style={[styles.aiText, { color: tokens.textSecondary }]}>
              AI:{' '}
              <Text style={{ color: tokens.textPrimary }}>
                "At the current pace, you will reach your goal in March. If you increase contributions by 100k per month
              </Text>
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => handleCreate(true)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={[styles.secondaryButtonText, { color: tokens.textSecondary }]}>
              Create and more
            </Text>
          </Pressable>
          <Pressable
            disabled={disablePrimary}
            onPress={() => handleCreate(false)}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && !disablePrimary && styles.pressed,
            ]}
          >
            <AdaptiveGlassView
              style={[
                styles.primaryButtonInner,
                {
                  backgroundColor: disablePrimary ? tokens.cardItem : tokens.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: disablePrimary ? tokens.textSecondary : tokens.accent },
                ]}
              >
                Create task
              </Text>
            </AdaptiveGlassView>
          </Pressable>
        </View>
      </CustomBottomSheet>

      {Platform.OS === 'ios' && showTimePicker && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
          <View style={styles.timePickerModal}>
            <Pressable style={styles.timePickerBackdrop} onPress={() => setShowTimePicker(false)} />
            <AdaptiveGlassView style={[styles.timePickerCard, { backgroundColor: tokens.cardItem }]}>
              <DateTimePicker
                value={timePickerValue}
                mode="time"
                is24Hour
                display="spinner"
                onChange={handleSelectTime}
              />
              <Pressable style={styles.timePickerDoneButton} onPress={() => setShowTimePicker(false)}>
                <Text style={[styles.timePickerDoneText, { color: tokens.accent }]}>Done</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}

      {Platform.OS === 'ios' && showDatePicker && (
        <Modal transparent visible animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
          <View style={styles.timePickerModal}>
            <Pressable style={styles.timePickerBackdrop} onPress={() => setShowDatePicker(false)} />
            <AdaptiveGlassView style={[styles.timePickerCard, { backgroundColor: tokens.cardItem }]}>
              <DateTimePicker
                value={datePickerValue}
                mode="date"
                display="inline"
                onChange={handleSelectDate}
              />
              <Pressable style={styles.timePickerDoneButton} onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.timePickerDoneText, { color: tokens.accent }]}>Done</Text>
              </Pressable>
            </AdaptiveGlassView>
          </View>
        </Modal>
      )}
    </>
  );
};

const AddTaskSheet = forwardRef<AddTaskSheetHandle, AddTaskSheetProps>(AddTaskSheetComponent);
AddTaskSheet.displayName = 'AddTaskSheet';

export default AddTaskSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
  },
  handleIndicator: {
    width: 42,
    height: 4,
    borderRadius: 10,
    opacity: 0.65,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 32,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  fieldSection: {
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 24,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  inputContainer: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    marginTop: 12,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
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
    paddingHorizontal: 20,
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
  glassSurface: {
    borderRadius: 14,
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
    color: '#7E8B9A',
  },
  aiSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 12
  },
  aiTextContainer: {
    flex: 1,
  },
  aiText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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
