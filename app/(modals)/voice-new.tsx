import React, {
  useCallback,
  useEffect,
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
import { VoiceSphereStable, VoiceSphereStage } from './_components/VoiceSphereStable';
import { useLocalization } from '@/localization/useLocalization';

// ==================== TYPES ====================
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

// ==================== CONSTANTS ====================

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

const ANALYSIS_DURATION = 3000;

// ==================== UTILITIES ====================
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

// ==================== SUB-COMPONENTS ====================
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
  strings,
}: {
  item: RecognizedRequest;
  theme: Theme;
  strings: { category: string; account: string; edit: string; confirm: string };
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
            { color: intentColor },
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
            {strings.category}
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
            {strings.account}
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
          icon={Edit3}
          label={strings.edit}
          color={theme.colors.textPrimary}
          backgroundColor={theme.colors.cardItem}
          borderColor={theme.colors.border}
        />
        <ActionIconButton
          icon={Check}
          label={strings.confirm}
          color={theme.colors.success}
          backgroundColor={theme.colors.cardItem}
          borderColor={theme.colors.border}
        />
      </View>
    </AdaptiveGlassView>
  );
};

const HistorySection = ({
  theme,
  strings,
}: {
  theme: Theme;
  strings: { requestsHistory: string; repeatRequest: string };
}) => (
  <View style={styles.historySection}>
    <Text
      style={[
        styles.sectionTitle,
        { color: theme.colors.textSecondary },
      ]}
    >
      {strings.requestsHistory}
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
          {strings.repeatRequest}
        </Text>
      </TouchableOpacity>
    </AdaptiveGlassView>
  </View>
);

const SummaryCard = ({
  theme,
  analyzing = false,
  strings,
}: {
  theme: Theme;
  analyzing?: boolean;
  strings: {
    analyzing: string;
    recognized: string;
    dataProcessing: string;
    latestStatement: string;
    aiMatching: string;
  };
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
      {analyzing ? strings.analyzing : strings.recognized}
    </Text>
    <Text
      style={[
        styles.summaryTitle,
        { color: theme.colors.textPrimary },
      ]}
    >
      {analyzing ? strings.dataProcessing : strings.latestStatement}
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
          {strings.aiMatching}
        </Text>
      </View>
    )}
  </AdaptiveGlassView>
);

const RecordingPlaybackRow = ({
  clip,
  theme,
}: {
  clip: RecordingClip;
  theme: Theme;
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
        styles.recordingCard,
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
          styles.playButton,
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
      <View style={styles.recordingInfo}>
        <Text
          style={[
            styles.recordingTitle,
            { color: theme.colors.textPrimary },
          ]}
        >
          {clip.label}
        </Text>
        <Text
          style={[
            styles.recordingMeta,
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
        />
      </View>
      <Text
        style={[
          styles.recordingDuration,
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
}: {
  active: boolean;
  progress: number;
  waveform: number[];
  theme: Theme;
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
    <View style={styles.waveformRow}>
      {bars.map((value, index) => {
        const ratio =
          bars.length > 1 ? index / (bars.length - 1) : 0;
        const isPlayed = ratio <= progress;
        return (
          <View
            key={`wave-${index}`}
            style={[
              styles.waveformBar,
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

// ==================== MAIN COMPONENT ====================
const VoiceMode = () => {
  const router = useRouter();
  const theme = useAppTheme();
  const { strings } = useLocalization();
  const voiceStrings = strings.modals.voice;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [stage, setStage] = useState<VoiceStage>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const [micStatus, setMicStatus] = useState<
    'unknown' | 'granted' | 'denied'
  >('unknown');
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [recordings, setRecordings] = useState<RecordingClip[]>([]);

  const recorder = useAudioRecorder(RECORDER_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 80);

  const scrollRef = useRef<ScrollView>(null);
  const resultsAnchorY = useRef(0);
  const recordingDurationRef = useRef(0);

  const sphereSize = Math.min(width - 64, 320);

  // Convert VoiceStage to VoiceSphereStage
  const sphereStage: VoiceSphereStage = useMemo(() => {
    // Analiz tugagandan keyin galochka ko'rinishida qolishi kerak
    if (hasAnalysis && stage === 'idle') {
      return 'complete';
    }
    switch (stage) {
      case 'idle':
        return 'idle';
      case 'listening':
        return 'listening';
      case 'analyzing':
        return 'analyzing';
      default:
        return 'idle';
    }
  }, [stage]);

  // Permission handling
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

  // Input level processing from metering
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

  // Microphone control
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

  // Stage transitions
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
    await stopMic();
    setHasAnalysis(false);
    setStage('idle');
  }, [stopMic]);

  // Handle analysis completion from sphere
  const handleAnalysisComplete = useCallback(() => {
    setStage('idle');
    setHasAnalysis(true);
  }, []);

  useEffect(() => {
    return () => {
      void stopMic();
    };
  }, [stopMic]);

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
      ? voiceStrings.startTalking
      : stage === 'listening'
        ? voiceStrings.stopAnalyze
        : voiceStrings.analyzingDots;

  const buttonDisabled = stage === 'analyzing';

  const headline = useMemo(() => {
    switch (stage) {
      case 'idle':
        return { title: voiceStrings.title, subtitle: voiceStrings.speakNaturally };
      case 'listening':
        return { title: voiceStrings.listening, subtitle: voiceStrings.mentionDetails };
      case 'analyzing':
        return { title: voiceStrings.analyzing, subtitle: voiceStrings.dataProcessing };
      default:
        return { title: voiceStrings.title, subtitle: voiceStrings.speakNaturally };
    }
  }, [stage, voiceStrings]);

  return (
    <SafeAreaView style={dynamicStyles(theme).safeArea} edges={['top']}>
      <View style={dynamicStyles(theme).header}>
        <Text style={dynamicStyles(theme).headerTitle}>{voiceStrings.leoraVoice}</Text>
        <TouchableOpacity
          style={dynamicStyles(theme).closeButton}
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
        contentContainerStyle={dynamicStyles(theme).scrollContent}
      >
        {/* Hero Section with Sphere */}
        <View style={dynamicStyles(theme).heroSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (stage === 'idle') {
                void beginListening();
              }
            }}
          >
            <VoiceSphereStable
              stage={sphereStage}
              size={sphereSize}
              inputLevel={inputLevel}
              accentColor={theme.colors.textPrimary}
              analysisDuration={ANALYSIS_DURATION}
              onAnalysisComplete={handleAnalysisComplete}
            />
          </TouchableOpacity>

          <View style={dynamicStyles(theme).labels}>
            <Text style={dynamicStyles(theme).title}>{headline.title}</Text>
            <Text style={dynamicStyles(theme).subtitle}>{headline.subtitle}</Text>
          </View>
        </View>

        {/* Analysis Results */}
        {hasAnalysis && (
          <View
            onLayout={(e) => {
              resultsAnchorY.current = e.nativeEvent.layout.y;
            }}
          >
            <SummaryCard
              theme={theme}
              analyzing={false}
              strings={{
                analyzing: voiceStrings.analyzing,
                recognized: voiceStrings.recognized,
                dataProcessing: voiceStrings.dataProcessing,
                latestStatement: voiceStrings.latestStatement,
                aiMatching: voiceStrings.aiMatching,
              }}
            />
            {RECOGNIZED_REQUESTS.map((item) => (
              <RecognizedCard
                key={item.id}
                item={item}
                theme={theme}
                strings={{
                  category: voiceStrings.category,
                  account: voiceStrings.account,
                  edit: voiceStrings.edit,
                  confirm: voiceStrings.confirm,
                }}
              />
            ))}
            <HistorySection
              theme={theme}
              strings={{
                requestsHistory: voiceStrings.requestsHistory,
                repeatRequest: voiceStrings.repeatRequest,
              }}
            />
          </View>
        )}

        {/* Analyzing state indicator */}
        {stage === 'analyzing' && (
          <SummaryCard
            theme={theme}
            analyzing={true}
            strings={{
              analyzing: voiceStrings.analyzing,
              recognized: voiceStrings.recognized,
              dataProcessing: voiceStrings.dataProcessing,
              latestStatement: voiceStrings.latestStatement,
              aiMatching: voiceStrings.aiMatching,
            }}
          />
        )}

        {/* Recordings Archive */}
        {recordings.length > 0 && (
          <View style={dynamicStyles(theme).recordingsSection}>
            <Text style={dynamicStyles(theme).sectionTitle}>
              {voiceStrings.capturedAudio}
            </Text>
            {recordings.map((clip) => (
              <RecordingPlaybackRow
                key={clip.id}
                clip={clip}
                theme={theme}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Footer with action button */}
      <View style={[dynamicStyles(theme).footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            dynamicStyles(theme).primaryButton,
            buttonDisabled && dynamicStyles(theme).primaryButtonDisabled,
          ]}
          onPress={handlePrimaryAction}
          disabled={buttonDisabled}
          activeOpacity={0.85}
        >
          <View style={dynamicStyles(theme).primaryButtonFill}>
            {stage === 'idle' && <Mic size={18} color={theme.colors.textPrimary} />}
            {stage === 'listening' && <Square size={18} color={theme.colors.textPrimary} />}
            {stage === 'analyzing' && (
              <ActivityIndicator size="small" color={theme.colors.textPrimary} />
            )}
            <Text style={dynamicStyles(theme).primaryButtonLabel}>
              {buttonLabel}
            </Text>
          </View>
        </TouchableOpacity>

        {stage === 'listening' && (
          <TouchableOpacity
            style={dynamicStyles(theme).secondaryButton}
            onPress={resetSession}
          >
            <X size={14} color={theme.colors.textSecondary} />
            <Text style={dynamicStyles(theme).secondaryLabel}>{voiceStrings.cancel}</Text>
          </TouchableOpacity>
        )}

        {micStatus === 'denied' && (
          <Text style={dynamicStyles(theme).permissionText}>
            {voiceStrings.microphoneRequired}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

// ==================== STYLES ====================
const dynamicStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 13,
      letterSpacing: 2,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    heroSection: {
      alignItems: 'center',
      paddingTop: 20,
      paddingBottom: 32,
    },
    labels: {
      marginTop: 26,
      alignItems: 'center',
    },
    title: {
      fontSize: 14,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: theme.colors.textPrimary,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
    },
    sectionTitle: {
      fontSize: 14,
      letterSpacing: 1.8,
      marginBottom: 12,
      marginTop: 16,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
    },
    recordingsSection: {
      marginTop: 12,
      gap: 12,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      gap: 12,
    },
    primaryButton: {
      borderRadius: 999,
      overflow: 'hidden',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
  });

const styles = StyleSheet.create({
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
  historyCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
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
    textTransform: 'uppercase',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    borderWidth: 1,
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
  },
  recordingMeta: {
    fontSize: 12,
  },
  recordingDuration: {
    fontSize: 12,
    fontWeight: '500',
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
});

export default VoiceMode;