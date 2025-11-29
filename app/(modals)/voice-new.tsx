import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Edit3,
  Mic,
  Pause,
  Play,
  Repeat2,
  Square,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import type { RecordingOptions } from 'expo-audio/build/Audio.types';

import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';
import { Theme, useAppTheme } from '@/constants/theme';
import { executePlannerVoiceIntent } from '@/features/planner/voiceIntentHandler';

type VoiceStage = 'idle' | 'listening' | 'analyzing';

type RecognizedRequest = {
  id: string;
  intent: 'Outcome' | 'Income';
  amount: string;
  status: string;
  category: string;
  account: string;
};

type RecordingClip = {
  id: string;
  uri: string;
  createdAt: number;
  durationMs?: number;
  label: string;
  waveform: number[];
};

const HEADLINES: Record<VoiceStage, { title: string; subtitle: string }> = {
  idle: {
    title: 'Voice assistant',
    subtitle: 'Speak naturally, as if you are talking to a friend.',
  },
  listening: {
    title: 'Listening',
    subtitle: 'Mention sums, tasks, or context — we pick up every detail.',
  },
  analyzing: {
    title: 'Analyzing',
    subtitle: 'Data processing and AI matching in progress.',
  },
};

const RECOGNIZED_REQUESTS: RecognizedRequest[] = [
  {
    id: 'req-outcome',
    intent: 'Outcome',
    status: 'AI processed',
    amount: '$100',
    category: 'Restaurant',
    account: 'Balance · Cash',
  },
  {
    id: 'req-income',
    intent: 'Income',
    status: 'AI processed',
    amount: '$50',
    category: 'Work',
    account: 'Balance · Cash',
  },
];

const HISTORY_ENTRY = {
  title: 'Restaurant spend',
  time: '09:00',
  description: 'Spent one hundred dollars at the restaurant.',
};

const SUMMARY_TEXT =
  'Spent 100 dollars at the restaurant and tagged it under Outcome · Balance Cash.';

const RECORDER_OPTIONS: RecordingOptions = {
  isMeteringEnabled: true,
  extension: '.m4a',
  sampleRate: 44100,
  numberOfChannels: 2,
  bitRate: 128000,
  android: {
    extension: '.m4a',
    outputFormat: 'mpeg4',
    audioEncoder: 'aac',
  },
  ios: {
    extension: '.m4a',
    sampleRate: 44100,
    outputFormat: 'aac ',
    audioQuality: 127,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

const ANALYSIS_DURATION = 2000;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const formatDurationMs = (value?: number | null) => {
  if (!value || Number.isNaN(value)) {
    return '--:--';
  }
  const totalSeconds = Math.max(0, Math.round(value / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const generateWaveformSamples = (bars: number, variance = 0.6) => {
  const values: number[] = [];
  let last = Math.random();
  for (let i = 0; i < bars; i += 1) {
    const noise = Math.random() * variance + 0.2;
    const next = last * 0.6 + noise * 0.4;
    values.push(Math.min(1, Math.max(0.15, next)));
    last = next;
  }
  return values;
};

/**
 * =====================================================================
 *  PORT OF HTML CANVAS WAVE LOGIC → react-native-svg
 * =====================================================================
 */

const NUM_LINES = 16;
const NUM_POINTS = 60;
const PI = Math.PI;

type LineConfig = {
  t: number;
  phase: number;
  ampVar: number;
  vSpread: number;
  speed: number;
  alpha: number;
};

type PointConfig = {
  t: number;
  env: number;
};

const LINE_CONFIGS: LineConfig[] = (() => {
  const arr: LineConfig[] = [];
  for (let i = 0; i < NUM_LINES; i += 1) {
    const t = i / (NUM_LINES - 1);
    arr.push({
      t,
      phase: t * PI * 2.2 + Math.sin(t * PI * 2.5) * 0.6,
      ampVar: 0.5 + Math.sin(t * PI * 2 + 0.3) * 0.5,
      vSpread: (t - 0.5) * 50,
      speed: 0.8 + t * 0.4,
      alpha: 0.15 + Math.sin(t * PI) * 0.45,
    });
  }
  return arr;
})();

const POINT_CONFIGS: PointConfig[] = (() => {
  const arr: PointConfig[] = [];
  for (let i = 0; i <= NUM_POINTS; i += 1) {
    const t = i / NUM_POINTS;
    const nodes = Math.abs(Math.cos(t * PI * 3));
    arr.push({
      t,
      env: 0.15 + nodes * 0.85,
    });
  }
  return arr;
})();

type WavePath = {
  d: string;
  opacity: number;
  width: number;
  gradient: 'top' | 'bottom';
  dashed?: number[];
};

const computeWavePaths = (
  radius: number,
  time: number,
  intensity: number,
): WavePath[] => {
  if (radius <= 0 || intensity <= 0) return [];

  const cx = radius;
  const cy = radius;
  const r = radius * 0.94;

  const waveWidth = r * 2.1;
  const startX = cx - r * 1.05;

  const paths: WavePath[] = [];

  for (let ribbon = 0; ribbon < 2; ribbon += 1) {
    const vDir = ribbon === 0 ? -1 : 1;
    const baseOff = ribbon === 0 ? -25 : 25;
    const tDir = ribbon === 0 ? 1 : -1;
    const gradient: 'top' | 'bottom' = ribbon === 0 ? 'top' : 'bottom';

    for (let li = 0; li < LINE_CONFIGS.length; li += 1) {
      const ld = LINE_CONFIGS[li];

      let d = '';
      for (let pi = 0; pi < POINT_CONFIGS.length; pi += 1) {
        const pd = POINT_CONFIGS[pi];
        const t = pd.t;

        const w1 = Math.sin(
          t * PI * 3 + time * ld.speed * tDir + ld.phase,
        ) * 70 * ld.ampVar;
        const w2 = Math.sin(
          t * PI * 2 + time * 0.7 * tDir + ld.phase * 0.6,
        ) * 35 * ld.ampVar;
        const w3 = Math.sin(
          t * PI * 5 + time * 1.2 * tDir + ld.t * PI * 1.5,
        ) * 18;

        const waveY = (w1 + w2 + w3) * pd.env;

        const wx = startX + t * waveWidth;
        const wy =
          cy +
          waveY * intensity * vDir +
          (baseOff + ld.vSpread) * intensity * pd.env;

        if (pi === 0) {
          d += `M${wx.toFixed(2)},${wy.toFixed(2)} `;
        } else {
          d += `L${wx.toFixed(2)},${wy.toFixed(2)} `;
        }
      }

      const alpha = ld.alpha * (0.4 + intensity * 0.6);
      const lineWidth = lerp(0.8, 1.6, intensity);

      const dashed =
        intensity > 0.45 && li % 5 === 0 ? [5, 10] : undefined;

      paths.push({
        d: d.trim(),
        opacity: alpha,
        width: lineWidth,
        gradient,
        dashed,
      });
    }
  }

  return paths;
};

/**
 * Сфера + волны (портированная логика из HTML)
 */
const VoiceSphere: React.FC<{
  stage: VoiceStage;
  size?: number;
  intensityTarget?: number; // 0..1
  accentColor?: string;
}> = ({ stage, size = 280, intensityTarget = 0, accentColor = '#ffffff' }) => {
  const gradientId = useId();
  const radius = size / 2;

  const showWave = stage !== 'idle';

  const ampRef = useRef(0);
  const timeRef = useRef(0);
  const speedRef = useRef(0.7);
  const frameRef = useRef(0);
  const [, setFrame] = useState(0);

  const stageRef = useRef<VoiceStage>(stage);
  const intensityRef = useRef<number>(intensityTarget);

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    intensityRef.current = intensityTarget ?? 0;
  }, [intensityTarget]);

  useEffect(() => {
    let mounted = true;
    let lastTs: number | null = null;

    const loop = (ts: number) => {
      if (!mounted) return;

      if (lastTs == null) {
        lastTs = ts;
      }
      const dt = ts - lastTs;
      lastTs = ts;

      const stageNow = stageRef.current;
      const intensityNow = clamp01(intensityRef.current || 0);

      let targetAmp = ampRef.current;
      let targetSpeed = speedRef.current;

      if (stageNow === 'listening') {
        const lvl = intensityNow;
        targetAmp = 0.135 + lvl * 0.85;
        targetSpeed = 0.7 + lvl * 1.3;
      } else if (stageNow === 'analyzing') {
        const breathe = (Math.sin(ts / 600) + 1) / 2;
        targetAmp = 0.3 + breathe * 0.3;
        targetSpeed = 0.6 + breathe * 0.5;
      } else {
        targetAmp = 0;
        targetSpeed = 0.5;
      }

      const ampLerp = targetAmp > ampRef.current ? 0.18 : 0.1;
      const speedLerp = 0.14;

      ampRef.current += (targetAmp - ampRef.current) * ampLerp;
      speedRef.current += (targetSpeed - speedRef.current) * speedLerp;

      const speed = Number.isFinite(speedRef.current)
        ? speedRef.current
        : 0.7;
      timeRef.current += (speed * dt) / 1000;

      frameRef.current += 1;
      setFrame(frameRef.current);

      requestAnimationFrame(loop);
    };

    const id = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(id);
    };
  }, []);

  const wavePaths = useMemo(() => {
    if (!showWave) return [];
    return computeWavePaths(radius, timeRef.current, ampRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [radius, showWave, ampRef.current]);

  return (
    <View
      style={{
        width: '100%',
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          {/* BAZA SFERA – ANCHA QORAROQ */}
          <RadialGradient
            id={`${gradientId}-base`}
            cx="50%"
            cy="50%"
            r="60%"
            fx="50%"
            fy="40%"
          >
            {/* markaz ham qoraroq bo‘ldi */}
            <Stop offset="0%" stopColor="#05070b" />
            <Stop offset="55%" stopColor="#05070b" />
            <Stop offset="85%" stopColor="#03040a" />
            <Stop offset="100%" stopColor="#020308" />
          </RadialGradient>

          {/* Yuqori lentlar: cyan → purple → cyan */}
          <SvgLinearGradient
            id={`${gradientId}-waves-top`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#4dd0ff" />
            <Stop offset="35%" stopColor="#a45bff" />
            <Stop offset="65%" stopColor="#a45bff" />
            <Stop offset="100%" stopColor="#4dd0ff" />
          </SvgLinearGradient>

          {/* Pastki lentlar: pink → purple → pink */}
          <SvgLinearGradient
            id={`${gradientId}-waves-bottom`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#ff65e6" />
            <Stop offset="35%" stopColor="#a45bff" />
            <Stop offset="65%" stopColor="#a45bff" />
            <Stop offset="100%" stopColor="#ff65e6" />
          </SvgLinearGradient>

          {/* Katta klip – sfera ichida */}
          <ClipPath id={`${gradientId}-clip`}>
            <Circle cx={radius} cy={radius} r={radius * 0.94} />
          </ClipPath>

          {/* Highlight – biroz kichikroq va kamroq oq */}
          <RadialGradient
            id={`${gradientId}-highlight`}
            cx="36%"
            cy="26%"
            r="40%"
          >
            <Stop offset="0%" stopColor="rgba(38, 36, 36, 0.1)" />
            <Stop offset="40%" stopColor="rgba(55, 53, 53, 0.03)" />
            <Stop offset="100%" stopColor="rgba(44, 42, 42, 0)" />
          </RadialGradient>
        </Defs>

        {/* Sfera bazasi */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.94}
          fill={`url(#${gradientId}-base)`}
        />

        {/* WAVES */}
        <G clipPath={`url(#${gradientId}-clip)`}>
          {wavePaths.map((wave, index) => (
            <Path
              key={index}
              d={wave.d}
              stroke={
                wave.gradient === 'top'
                  ? `url(#${gradientId}-waves-top)`
                  : `url(#${gradientId}-waves-bottom)`
              }
              strokeWidth={wave.width}
              strokeDasharray={wave.dashed}
              opacity={wave.opacity}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </G>

        {/* Yumshoq highlight tepada */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.94}
          fill={`url(#${gradientId}-highlight)`}
          opacity={0.42}
        />

        {/* Chegarasi ham biroz qoraroq */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius * 0.94}
          stroke="rgba(70,84,120,0.7)"
          strokeWidth={1.2}
          fill="none"
        />
      </Svg>

      {!showWave && (
        <View style={styles.iconOverlay}>
          <Mic size={38} color={accentColor} />
        </View>
      )}
    </View>
  );
};

/**
 * =====================================================================
 *  ОСТАЛЬНОЙ КОД — БЕЗ ИЗМЕНЕНИЙ
 * =====================================================================
 */

const ActionIconButton = ({
  icon: Icon,
  label,
  color,
  backgroundColor,
  borderColor,
}: {
  icon: typeof Check;
  label: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
}) => (
  <TouchableOpacity
    accessibilityRole="button"
    accessibilityLabel={label}
    style={[
      styles.actionIcon,
      { backgroundColor, borderColor },
    ]}
    activeOpacity={0.9}
  >
    <Icon size={18} color={color} />
  </TouchableOpacity>
);

const RecognizedCard = ({
  item,
  theme,
}: {
  item: RecognizedRequest;
  theme: Theme;
}) => {
  const Icon = item.intent === 'Income' ? ArrowUpRight : ArrowDownRight;
  const intentColor =
    item.intent === 'Income' ? theme.colors.success : theme.colors.danger;

  return (
    <AdaptiveGlassView
      style={[
        styles.recognitionCard,
        {
          backgroundColor: theme.colors.card,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.intentBadge,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.cardItem,
            },
          ]}
        >
          <Icon size={18} color={intentColor} />
        </View>
        <View style={styles.intentInfo}>
          <Text
            style={[
              styles.intentTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            {item.intent}
          </Text>
          <Text
            style={[
              styles.intentSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            {item.status}
          </Text>
        </View>
        <Text
          style={[
            styles.intentAmount,
            { color: theme.colors.textPrimary },
          ]}
        >
          {item.amount}
        </Text>
      </View>
      <View style={styles.cardMetaRow}>
        <View style={styles.metaColumn}>
          <Text
            style={[
              styles.metaLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Category
          </Text>
          <Text
            style={[
              styles.metaValue,
              { color: theme.colors.textPrimary },
            ]}
          >
            {item.category}
          </Text>
        </View>
        <View style={styles.metaColumn}>
          <Text
            style={[
              styles.metaLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Balance
          </Text>
          <Text
            style={[
              styles.metaValue,
              { color: theme.colors.textPrimary },
            ]}
          >
            {item.account}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <ActionIconButton
          icon={Check}
          label="Approve request"
          color={theme.colors.textPrimary}
          backgroundColor={theme.colors.cardItem}
          borderColor={theme.colors.border}
        />
        <ActionIconButton
          icon={Edit3}
          label="Edit details"
          color={theme.colors.textPrimary}
          backgroundColor={theme.colors.cardItem}
          borderColor={theme.colors.border}
        />
        <ActionIconButton
          icon={Repeat2}
          label="Repeat action"
          color={theme.colors.textPrimary}
          backgroundColor={theme.colors.cardItem}
          borderColor={theme.colors.border}
        />
      </View>
    </AdaptiveGlassView>
  );
};

const HistoryCard = ({ theme }: { theme: Theme }) => (
  <View style={styles.historySection}>
    <View
      style={[
        styles.sheetHandle,
        { backgroundColor: theme.colors.border },
      ]}
    />
    <Text
      style={[
        styles.sectionTitle,
        { color: theme.colors.textSecondary },
      ]}
    >
      Requests history
    </Text>
    <AdaptiveGlassView
      style={[
        styles.historyCard,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.historyHeader}>
        <View>
          <Text
            style={[
              styles.historyTitle,
              { color: theme.colors.textPrimary },
            ]}
          >
            {HISTORY_ENTRY.title}
          </Text>
          <Text
            style={[
              styles.historyMeta,
              { color: theme.colors.textSecondary },
            ]}
          >
            {HISTORY_ENTRY.description}
          </Text>
        </View>
        <Text
          style={[
            styles.historyTime,
            { color: theme.colors.textSecondary },
          ]}
        >
          {HISTORY_ENTRY.time}
        </Text>
      </View>
      <TouchableOpacity style={styles.repeatButton} activeOpacity={0.9}>
        <Repeat2 size={15} color={theme.colors.textPrimary} />
        <Text
          style={[
            styles.repeatLabel,
            { color: theme.colors.textPrimary },
          ]}
        >
          Repeat request
        </Text>
      </TouchableOpacity>
    </AdaptiveGlassView>
  </View>
);

const SummaryCard = ({
  theme,
  analyzing = false,
}: {
  theme: Theme;
  analyzing?: boolean;
}) => (
  <AdaptiveGlassView
    style={[
      styles.summaryCard,
      {
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
      },
    ]}
  >
    <Text
      style={[
        styles.summaryLabel,
        { color: theme.colors.textSecondary },
      ]}
    >
      {analyzing ? 'Analyzing' : 'Recognized'}
    </Text>
    <Text
      style={[
        styles.summaryTitle,
        { color: theme.colors.textPrimary },
      ]}
    >
      {analyzing ? 'Data processing...' : 'Latest statement'}
    </Text>
    {!analyzing && (
      <Text
        style={[
          styles.summaryBody,
          { color: theme.colors.textSecondary },
        ]}
      >
        {SUMMARY_TEXT}
      </Text>
    )}
    {analyzing && (
      <View style={styles.processingRow}>
        <Activity size={14} color={theme.colors.textSecondary} />
        <Text
          style={[
            styles.processingText,
            { color: theme.colors.textSecondary },
          ]}
        >
          AI is matching entities
        </Text>
      </View>
    )}
  </AdaptiveGlassView>
);

const RecordingPlaybackRow = ({
  clip,
  theme,
  styles: stylesWithTheme,
}: {
  clip: RecordingClip;
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}) => {
  const player = useAudioPlayer(clip.uri);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;
  const durationSeconds =
    clip.durationMs != null
      ? clip.durationMs / 1000
      : status?.duration ?? 0;
  const currentSeconds = status?.currentTime ?? 0;
  const progress =
    durationSeconds > 0
      ? Math.min(1, currentSeconds / durationSeconds)
      : 0;

  const togglePlayback = useCallback(async () => {
    try {
      if (isPlaying) {
        void player.pause();
      } else {
        if (
          durationSeconds > 0 &&
          currentSeconds >= durationSeconds - 0.05
        ) {
          await player.seekTo(0);
        }
        void player.play();
      }
    } catch (error) {
      console.warn('Unable to toggle playback', error);
    }
  }, [currentSeconds, durationSeconds, isPlaying, player]);

  const durationLabel = formatDurationMs(
    clip.durationMs ??
    (status?.duration ? status.duration * 1000 : undefined),
  );

  const createdLabel = useMemo(() => {
    try {
      return new Date(clip.createdAt).toLocaleTimeString();
    } catch {
      return '';
    }
  }, [clip.createdAt]);

  return (
    <AdaptiveGlassView
      style={[
        stylesWithTheme.recordingCard,
        {
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
      ]}
    >
      <TouchableOpacity
        onPress={togglePlayback}
        activeOpacity={0.85}
        style={[
          stylesWithTheme.playButton,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.cardItem,
          },
        ]}
      >
        {isPlaying ? (
          <Pause size={16} color={theme.colors.textPrimary} />
        ) : (
          <Play size={16} color={theme.colors.textPrimary} />
        )}
      </TouchableOpacity>
      <View style={stylesWithTheme.recordingInfo}>
        <Text
          style={[
            stylesWithTheme.recordingTitle,
            { color: theme.colors.textPrimary },
          ]}
        >
          {clip.label}
        </Text>
        <Text
          style={[
            stylesWithTheme.recordingMeta,
            { color: theme.colors.textSecondary },
          ]}
        >
          {createdLabel}
        </Text>
        <PlaybackWaveform
          active={isPlaying}
          progress={progress}
          waveform={clip.waveform}
          theme={theme}
          styles={stylesWithTheme}
        />
      </View>
      <Text
        style={[
          stylesWithTheme.recordingDuration,
          { color: theme.colors.textSecondary },
        ]}
      >
        {isPlaying && durationSeconds > 0
          ? formatDurationMs(currentSeconds * 1000)
          : durationLabel}
      </Text>
    </AdaptiveGlassView>
  );
};

const PlaybackWaveform = ({
  active,
  progress,
  waveform,
  theme,
  styles: stylesWithTheme,
}: {
  active: boolean;
  progress: number;
  waveform: number[];
  theme: Theme;
  styles: ReturnType<typeof createStyles>;
}) => {
  const [bars, setBars] = useState<number[]>(
    waveform.length ? waveform : generateWaveformSamples(32),
  );

  useEffect(() => {
    if (!active) {
      setBars(waveform);
    }
  }, [active, waveform]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      setBars((prev) =>
        prev.map((value, index) => {
          const noise = Math.random();
          const target = active ? noise : waveform[index] ?? noise;
          return value + (target - value) * 0.35;
        }),
      );
    };

    if (active) {
      interval = setInterval(tick, 90);
    } else {
      tick();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [active, waveform]);

  return (
    <View style={stylesWithTheme.waveformRow}>
      {bars.map((value, index) => {
        const ratio =
          bars.length > 1 ? index / (bars.length - 1) : 0;
        const isPlayed = ratio <= progress;
        return (
          <View
            key={`wave-${index}`}
            style={[
              stylesWithTheme.waveformBar,
              {
                height: 6 + value * 18,
                backgroundColor: isPlayed
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
                opacity: isPlayed ? 0.95 : 0.35,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const VoiceMode = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const stylesWithTheme = useMemo(
    () => createStyles(theme),
    [theme],
  );
  const [stage, setStage] = useState<VoiceStage>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const [micStatus, setMicStatus] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [recordings, setRecordings] = useState<RecordingClip[]>([]);
  const recorder = useAudioRecorder(RECORDER_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);
  const analyzingTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const resultsAnchorY = useRef(0);
  const recordingDurationRef = useRef(0);
  const plannerCommands = useMemo(
    () => [
      {
        id: 'task',
        label: 'Add task "Write brief" tomorrow at 15:00',
        command:
          'Add task "Write brief" tomorrow at 15:00 at @work',
      },
      {
        id: 'habit',
        label: 'Add habit "Drink water" every morning',
        command: 'Add habit "Drink water" every morning',
      },
      {
        id: 'focus',
        label: 'Start focus on "Prototype review"',
        command: 'Start focus on "Prototype review" pomodoro',
      },
    ],
    [],
  );
  const [plannerLogs, setPlannerLogs] = useState<string[]>([]);
  const handlePlannerCommand = useCallback((command: string) => {
    const result = executePlannerVoiceIntent(command);
    setPlannerLogs((prev) => [result.message, ...prev].slice(0, 3));
  }, []);

  const sphereSize = Math.min(width - 64, 320);

  const clearAnalyzingTimer = useCallback(() => {
    if (analyzingTimerRef.current) {
      clearTimeout(analyzingTimerRef.current);
      analyzingTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearAnalyzingTimer();
  }, [clearAnalyzingTimer]);

  const ensurePermission = useCallback(async () => {
    if (micStatus === 'granted') return true;
    try {
      let granted = false;
      const current = await getRecordingPermissionsAsync();
      granted = current.status === 'granted';
      if (!granted) {
        const requestResult =
          await requestRecordingPermissionsAsync();
        granted = requestResult.status === 'granted';
      }
      if (granted) {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          shouldRouteThroughEarpiece: false,
          interruptionMode: 'doNotMix',
          interruptionModeAndroid: 'doNotMix',
        });
        setMicStatus('granted');
        return true;
      }
      setMicStatus('denied');
      return false;
    } catch {
      setMicStatus('denied');
      return false;
    }
  }, [micStatus]);

  const ambientLevelRef = useRef(0.02);
  const updateInputLevelFromMetering = useCallback(
    (metering: number | undefined, isListening: boolean) => {
      if (typeof metering !== 'number') return;
      const linear = clamp01(Math.pow(10, metering / 20));
      const smoothing = isListening ? 0.93 : 0.8;
      ambientLevelRef.current =
        ambientLevelRef.current * smoothing +
        linear * (1 - smoothing);
      const platformFloorFactor =
        Platform.OS === 'android' ? 0.75 : 1;
      const noiseFloor =
        ambientLevelRef.current *
        (isListening ? 1.15 : 1) *
        platformFloorFactor;
      const signal = Math.max(0, linear - noiseFloor);
      const platformGain = Platform.OS === 'android' ? 26 : 14;
      const responseCurve =
        Platform.OS === 'android' ? 0.78 : 0.85;
      const scaled = clamp01(
        Math.pow(signal * platformGain, responseCurve),
      );
      setInputLevel((prev) => prev * 0.35 + scaled * 0.65);
    },
    [],
  );

  useEffect(() => {
    void ensurePermission();
  }, [ensurePermission]);

  useEffect(() => {
    updateInputLevelFromMetering(
      recorderState.metering,
      stage === 'listening',
    );
  }, [recorderState.metering, stage, updateInputLevelFromMetering]);

  useEffect(() => {
    if (
      stage === 'listening' &&
      typeof recorderState.durationMillis === 'number'
    ) {
      recordingDurationRef.current = recorderState.durationMillis;
    }
  }, [recorderState.durationMillis, stage]);

  const stopMic = useCallback(async () => {
    let uri: string | null = null;
    try {
      await recorder.stop();
      uri = recorder.uri ?? null;
    } catch {
      // recorder might not be recording
    }
    setInputLevel(0);
    return uri;
  }, [recorder]);

  const startMic = useCallback(async () => {
    const granted = await ensurePermission();
    if (!granted) return false;
    await stopMic();
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      return true;
    } catch (error) {
      console.warn('Unable to access microphone', error);
      return false;
    }
  }, [ensurePermission, recorder, stopMic]);

  const addRecordingClip = useCallback((uri: string) => {
    setRecordings((prev) => {
      const nextIndex = prev.length + 1;
      const waveform = generateWaveformSamples(40);
      return [
        {
          id: `recording-${Date.now()}-${nextIndex}`,
          uri,
          createdAt: Date.now(),
          durationMs: recordingDurationRef.current || undefined,
          label: `Recording ${nextIndex}`,
          waveform,
        },
        ...prev,
      ];
    });
    recordingDurationRef.current = 0;
  }, []);

  const transitionToAnalyzing = useCallback(async () => {
    const uri = await stopMic();
    if (uri) {
      addRecordingClip(uri);
    }
    setStage('analyzing');
  }, [addRecordingClip, stopMic]);

  const beginListening = useCallback(async () => {
    const started = await startMic();
    if (!started) return;
    setHasAnalysis(false);
    setStage('listening');
  }, [startMic]);

  const resetSession = useCallback(async () => {
    clearAllTimers();
    await stopMic();
    setHasAnalysis(false);
    setStage('idle');
  }, [clearAllTimers, stopMic]);

  useEffect(() => {
    if (stage !== 'analyzing') return;
    analyzingTimerRef.current = setTimeout(() => {
      setStage('idle');
      setHasAnalysis(true);
    }, ANALYSIS_DURATION);
    return () => {
      clearAnalyzingTimer();
    };
  }, [clearAnalyzingTimer, stage]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      void stopMic();
    };
  }, [clearAllTimers, stopMic]);

  useEffect(() => {
    if (stage === 'idle' && hasAnalysis && scrollRef.current) {
      requestAnimationFrame(() => {
        const offset = Math.max(resultsAnchorY.current - 40, 0);
        scrollRef.current?.scrollTo({ y: offset, animated: true });
      });
    }
  }, [hasAnalysis, stage]);

  const handlePrimaryAction = useCallback(() => {
    if (stage === 'idle') {
      void beginListening();
      return;
    }
    if (stage === 'listening') {
      void transitionToAnalyzing();
    }
  }, [beginListening, stage, transitionToAnalyzing]);

  const buttonLabel =
    stage === 'idle'
      ? 'Start talking'
      : stage === 'listening'
        ? 'Stop & analyze'
        : 'Analyzing...';

  const buttonDisabled = stage === 'analyzing';
  const recordingsArchive =
    recordings.length > 0 ? (
      <View style={stylesWithTheme.recordingsSection}>
        <Text style={stylesWithTheme.sectionTitle}>
          Captured audio
        </Text>
        {recordings.map((clip) => (
          <RecordingPlaybackRow
            key={clip.id}
            clip={clip}
            theme={theme}
            styles={stylesWithTheme}
          />
        ))}
      </View>
    ) : null;

  return (
    <SafeAreaView style={stylesWithTheme.safeArea} edges={['top']}>
      <View style={stylesWithTheme.header}>
        <Text style={stylesWithTheme.headerTitle}>LEORA VOICE</Text>
        <TouchableOpacity
          style={stylesWithTheme.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close voice modal"
        >
          <X size={18} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={stylesWithTheme.scrollContent}
      >
        <View style={stylesWithTheme.heroSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (stage === 'idle') {
                void beginListening();
              }
            }}
          >
            <VoiceSphere
              stage={stage}
              size={sphereSize}
              accentColor={theme.colors.textPrimary}
              intensityTarget={
                stage === 'listening'
                  ? Math.max(0, Math.min(1, 0.12 + inputLevel * 0.6))
                  : stage === 'analyzing'
                    ? 0.16
                    : 0
              }
            />
          </TouchableOpacity>
          <View style={stylesWithTheme.stageCopy}>
            <Text style={stylesWithTheme.stageLabel}>
              {stage.toUpperCase()}
            </Text>
            <Text style={stylesWithTheme.stageTitle}>
              {HEADLINES[stage].title}
            </Text>
            <Text style={stylesWithTheme.stageSubtitle}>
              {HEADLINES[stage].subtitle}
            </Text>
          </View>
        </View>

        {stage === 'analyzing' && (
          <>
            <SummaryCard theme={theme} analyzing />
            {recordingsArchive}
          </>
        )}

        {stage === 'idle' && hasAnalysis && (
          <View
            onLayout={(event) => {
              resultsAnchorY.current =
                event.nativeEvent.layout.y;
            }}
          >
            <SummaryCard theme={theme} />
            {recordingsArchive}
            <Text style={stylesWithTheme.sectionTitle}>
              Recognized requests
            </Text>
            {RECOGNIZED_REQUESTS.map((item) => (
              <RecognizedCard
                key={item.id}
                item={item}
                theme={theme}
              />
            ))}
          </View>
        )}

        {stage === 'idle' && !hasAnalysis && (
          <HistoryCard theme={theme} />
        )}

        <View style={stylesWithTheme.plannerSection}>
          <Text style={stylesWithTheme.sectionTitle}>
            Planner quick commands
          </Text>
          {plannerCommands.map((cmd) => (
            <TouchableOpacity
              key={cmd.id}
              style={stylesWithTheme.plannerCommand}
              onPress={() => handlePlannerCommand(cmd.command)}
              activeOpacity={0.9}
            >
              <Text style={stylesWithTheme.plannerCommandText}>
                {cmd.label}
              </Text>
            </TouchableOpacity>
          ))}
          {plannerLogs.length > 0 && (
            <View style={stylesWithTheme.plannerLog}>
              {plannerLogs.map((log, index) => (
                <Text
                  key={`${log}-${index}`}
                  style={stylesWithTheme.plannerLogText}
                >
                  {log}
                </Text>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View
        style={[
          stylesWithTheme.footer,
          {
            paddingBottom: Math.max(insets.bottom, 20),
            marginHorizontal: 20,
            paddingTop: 12,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={buttonDisabled}
          onPress={handlePrimaryAction}
          style={[
            stylesWithTheme.primaryButton,
            buttonDisabled &&
            stylesWithTheme.primaryButtonDisabled,
            { borderColor: theme.colors.border, borderWidth: 1 },
          ]}
        >
          <View
            style={[
              stylesWithTheme.primaryButtonFill,
              {
                backgroundColor:
                  stage === 'listening'
                    ? theme.colors.cardItem
                    : theme.colors.card,
              },
            ]}
          >
            {stage === 'analyzing' ? (
              <ActivityIndicator
                color={theme.colors.textPrimary}
              />
            ) : (
              <Mic size={18} color={theme.colors.textPrimary} />
            )}
            <Text style={stylesWithTheme.primaryButtonLabel}>
              {buttonLabel}
            </Text>
          </View>
        </TouchableOpacity>

        {stage === 'listening' && (
          <TouchableOpacity
            style={stylesWithTheme.secondaryButton}
            onPress={() => {
              void transitionToAnalyzing();
            }}
            activeOpacity={0.8}
          >
            <Square size={16} color={theme.colors.textPrimary} />
            <Text style={stylesWithTheme.secondaryLabel}>
              Stop talking
            </Text>
          </TouchableOpacity>
        )}

        {stage === 'idle' && hasAnalysis && (
          <TouchableOpacity
            style={stylesWithTheme.secondaryButton}
            onPress={() => {
              void resetSession();
            }}
            activeOpacity={0.8}
          >
            <Repeat2
              size={16}
              color={theme.colors.textPrimary}
            />
            <Text style={stylesWithTheme.secondaryLabel}>
              Reset session
            </Text>
          </TouchableOpacity>
        )}

        {micStatus === 'denied' && (
          <Text style={stylesWithTheme.permissionText}>
            Microphone access is required. Enable it in system
            settings to use Leora Voice.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      paddingTop: 32,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      marginHorizontal: 20,
    },
    headerTitle: {
      fontSize: 14,
      letterSpacing: 4,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardItem,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      paddingBottom: 32,
      marginHorizontal: 20,
    },
    heroSection: {
      alignItems: 'center',
      gap: 16,
      marginBottom: 24,
    },
    stageCopy: {
      alignItems: 'center',
      gap: 6,
    },
    stageLabel: {
      fontSize: 12,
      letterSpacing: 3,
      color: theme.colors.textSecondary,
    },
    stageTitle: {
      fontSize: 26,
      color: theme.colors.textPrimary,
      fontWeight: '600',
      textAlign: 'center',
    },
    stageSubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 14,
      letterSpacing: 1.8,
      color: theme.colors.textSecondary,
      marginBottom: 12,
      marginTop: 16,
    },
    recognitionCard: {
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardItem,
      marginBottom: 14,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    intentBadge: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.card,
      borderColor: theme.colors.border,
    },
    intentInfo: {
      flex: 1,
    },
    intentTitle: {
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    intentSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    intentAmount: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    cardMetaRow: {
      flexDirection: 'row',
      gap: 20,
      marginBottom: 16,
    },
    metaColumn: {
      flex: 1,
    },
    metaLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    metaValue: {
      fontSize: 15,
      color: theme.colors.textPrimary,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 10,
      justifyContent: 'flex-end',
    },
    historySection: {
      marginTop: 8,
      paddingBottom: 16,
    },
    sheetHandle: {
      alignSelf: 'center',
      width: 46,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      marginBottom: 18,
    },
    historyCard: {
      borderRadius: 18,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardItem,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    historyTitle: {
      fontSize: 16,
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    historyMeta: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    historyTime: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    repeatButton: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      paddingVertical: 8,
    },
    repeatLabel: {
      fontSize: 13,
      color: theme.colors.textPrimary,
      fontWeight: '500',
    },
    summaryCard: {
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardItem,
      marginBottom: 18,
    },
    summaryLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      letterSpacing: 2,
      marginBottom: 6,
    },
    summaryTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 8,
    },
    summaryBody: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 22,
    },
    processingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
    },
    processingText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
    },
    footer: {
      gap: 12,
    },
    primaryButton: {
      borderRadius: 999,
      overflow: 'hidden',
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonFill: {
      paddingVertical: 16,
      borderRadius: 999,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    primaryButtonLabel: {
      fontSize: 15,
      color: theme.colors.textPrimary,
      fontWeight: '600',
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      gap: 8,
    },
    secondaryLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      letterSpacing: 1,
    },
    permissionText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    recordingsSection: {
      marginTop: 12,
      gap: 12,
    },
    recordingCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
    },
    playButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    recordingInfo: {
      flex: 1,
      gap: 2,
    },
    recordingTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    recordingMeta: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    recordingDuration: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
    },
    waveformRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 2,
      marginTop: 6,
      height: 24,
    },
    waveformBar: {
      width: 2,
      borderRadius: 999,
    },
    plannerSection: {
      marginTop: 24,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.cardItem,
      padding: 18,
      gap: 12,
    },
    plannerCommand: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    plannerCommandText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    plannerLog: {
      marginTop: 8,
      borderRadius: 12,
      backgroundColor: theme.colors.card,
      padding: 10,
      gap: 4,
    },
    plannerLogText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

const styles = StyleSheet.create({
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    fontSize: 48,
    fontWeight: '700',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recognitionCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  intentBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentInfo: {
    flex: 1,
  },
  intentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  intentSubtitle: {
    fontSize: 13,
  },
  intentAmount: {
    fontSize: 20,
    fontWeight: '600',
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  metaColumn: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 15,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  historySection: {
    marginTop: 8,
    paddingBottom: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 3,
    marginBottom: 18,
  },
  historyCard: {
    borderRadius: 18,
    padding: 18,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyMeta: {
    fontSize: 13,
    marginTop: 4,
  },
  historyTime: {
    fontSize: 13,
  },
  repeatButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  repeatLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 14,
    letterSpacing: 1.8,
    marginBottom: 12,
    marginTop: 16,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },
  summaryLabel: {
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  processingText: {
    fontSize: 13,
  },
});

export default VoiceMode;
