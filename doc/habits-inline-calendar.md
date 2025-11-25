# Habits Inline Calendar (Archived)

The Habits tab previously rendered a bespoke inline calendar card that combined the
week strip and the full calendar in a single expandable component. The UI has been
parked for now, but the implementation is kept here for reference.

> File of origin: `app/(tabs)/(planner)/(tabs)/habits.tsx`

```tsx
type WeekStripDay = ReturnType<typeof buildWeekStrip>[number] & { label: string; number: string };
type CalendarDay = ReturnType<typeof buildCalendarDays>[number] & { label: string };

type CollapsibleCalendarCardProps = {
  expanded: boolean;
  theme: ReturnType<typeof useAppTheme>;
  weekDays: WeekStripDay[];
  onWeekDayPress: (date: Date) => void;
  calendarDays: CalendarDay[];
  calendarWeekLabels: string[];
  monthShortLabels: string[];
  monthName: string;
  yearNumber: number;
  visibleMonth: Date;
  onMonthChange: (direction: 'prev' | 'next') => void;
  onSelectDate: (date: Date) => void;
  onVisibleMonthChange: (updater: (prev: Date) => Date) => void;
  onToggle: () => void;
};

const CollapsibleCalendarCard: React.FC<CollapsibleCalendarCardProps> = ({
  expanded,
  theme,
  weekDays,
  onWeekDayPress,
  calendarDays,
  calendarWeekLabels,
  monthShortLabels,
  monthName,
  yearNumber,
  visibleMonth,
  onMonthChange,
  onSelectDate,
  onVisibleMonthChange,
  onToggle,
}) => {
  const styles = useStyles();
  const weeks = useCalendarWeeks(calendarDays);
  const [pickerMode, setPickerMode] = useState<'days' | 'months' | 'years'>('days');
  const [yearGridStart, setYearGridStart] = useState(() => {
    const year = visibleMonth.getFullYear();
    return year - (year % 12);
  });
  const [inlineHeight, setInlineHeight] = useState(0);
  const [weekHeight, setWeekHeight] = useState(0);
  const inlineProgress = useRef(new Animated.Value(expanded ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(inlineProgress, {
      toValue: expanded ? 1 : 0,
      duration: 260,
      useNativeDriver: false,
    }).start();
  }, [expanded, inlineProgress]);

  useEffect(() => {
    if (!expanded) {
      setPickerMode('days');
    }
  }, [expanded]);

  useEffect(() => {
    const year = visibleMonth.getFullYear();
    if (year < yearGridStart || year >= yearGridStart + 12) {
      setYearGridStart(year - (year % 12));
    }
  }, [visibleMonth, yearGridStart]);

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (pickerMode === 'years') {
        setYearGridStart((start) => start + (direction === 'prev' ? -12 : 12));
        return;
      }
      if (pickerMode === 'months') {
        onVisibleMonthChange((prev) =>
          new Date(prev.getFullYear() + (direction === 'prev' ? -1 : 1), prev.getMonth(), 1),
        );
        return;
      }
      onMonthChange(direction);
    },
    [onMonthChange, onVisibleMonthChange, pickerMode],
  );

  const handleMonthSelect = useCallback(
    (index: number) => {
      onVisibleMonthChange(() => new Date(yearNumber, index, 1));
      setPickerMode('days');
    },
    [onVisibleMonthChange, yearNumber],
  );

  const handleYearSelect = useCallback(
    (year: number) => {
      onVisibleMonthChange(() => new Date(year, visibleMonth.getMonth(), 1));
      setPickerMode('months');
    },
    [onVisibleMonthChange, visibleMonth],
  );

  return (
    <AdaptiveGlassView style={styles.calendarCard}>
      {/* Week strip */}
      <Pressable style={styles.weekTapArea} onPress={onToggle} accessibilityRole="button">
        <Text style={styles.weekTapLabel}>{expanded ? 'Hide calendar' : 'Show calendar'}</Text>
        <Animated.View
          style={{
            transform: [
              {
                rotate: inlineProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <ChevronDown size={14} color={theme.colors.textSecondary} />
        </Animated.View>
      </Pressable>
      {/* ...rest of the rendering omitted for brevity ... */}
    </AdaptiveGlassView>
  );
};
```

The accompanying animated styles (week strip, inline calendar body, month/year grids) can be
pulled from the original stylesheet in `habits.tsx` history if the component is resurrected.
