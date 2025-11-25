import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Play, X } from 'lucide-react-native';
import { VideoView, useVideoPlayer } from 'expo-video';

import { useAppTheme } from '@/constants/theme';
import { PROGRESS_METRIC_COPY, type ProgressMetricKey } from '@/features/progress/progressContent';
import { AdaptiveGlassView } from '@/components/ui/AdaptiveGlassView';

const getMetricKey = (raw?: string): ProgressMetricKey => {
  if (raw === 'budget' || raw === 'focus' || raw === 'tasks') {
    return raw;
  }
  return 'tasks';
};

export default function ProgressInfoScreen() {
  const params = useLocalSearchParams<{ metric?: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [videoError, setVideoError] = useState<string | null>(null);

  const metricKey = getMetricKey(params.metric);
  const copy = PROGRESS_METRIC_COPY[metricKey];
  const info = copy.info;

  const thresholds = useMemo(() => info.thresholds, [info.thresholds]);
  const videoMeta = useMemo(() => {
    const parts = [info.videoAuthor, info.videoMeta].filter(Boolean);
    return parts.join(' • ');
  }, [info.videoAuthor, info.videoMeta]);

  const hasPoster = Boolean(info.videoPoster);
  const [showPosterOverlay, setShowPosterOverlay] = useState(true);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const player = useVideoPlayer(info.videoUrl);

  useEffect(() => {
    setShowPosterOverlay(true);
    setIsVideoOpen(false);
  }, [info.videoUrl]);

  const handleCloseVideo = useCallback(() => {
    try {
      player.pause();
      player.currentTime = 0;
    } catch (error) {
      console.warn('Unable to reset video', error);
    }
    setIsVideoOpen(false);
    setShowPosterOverlay(true);
  }, [player]);

  useEffect(() => {
    player.loop = false;

    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') {
        setVideoError(error?.message ?? 'Unable to load video');
      } else {
        setVideoError(null);
      }
    });

    const endSub = player.addListener('playToEnd', handleCloseVideo);

    return () => {
      statusSub.remove();
      endSub.remove();
    };
  }, [player, handleCloseVideo]);

  const handleStartVideo = useCallback(() => {
    setShowPosterOverlay(false);
    setIsVideoOpen(true);
    try {
      player.play();
    } catch (error) {
      console.warn('Unable to start video', error);
      setVideoError('Unable to start video');
    }
  }, [player]);

  const styles = createStyles(theme);

  return (
    <>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        edges={["top"]}
      >
        <View style={[styles.header,]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            accessibilityRole="button"
          >
            <X color={theme.colors.textPrimary} size={20} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            About {copy.title}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 48 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.videoCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.videoTitle, { color: theme.colors.textPrimary }]}>
              {info.videoTitle}
            </Text>
            <Text style={[styles.videoDescription, { color: theme.colors.textSecondary }]}>
              {info.videoDescription}
            </Text>
            <View style={[styles.videoWrapper, { borderColor: theme.colors.border }]}>
              {hasPoster ? (
                <ImageBackground
                  source={{ uri: info.videoPoster! }}
                  style={styles.posterImage}
                  imageStyle={styles.posterImage}
                  resizeMode="cover"
                >
                  {showPosterOverlay ? (
                    <View style={styles.posterOverlayContent}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleStartVideo}
                      >
                        <AdaptiveGlassView style={[styles.playButton, { backgroundColor: theme.colors.card }]}>
                          <Play color={theme.colors.white} size={24} />
                        </AdaptiveGlassView>
                      </Pressable>
                    </View>
                  ) : null}
                </ImageBackground>
              ) : (
                <View style={[styles.posterFallback, { backgroundColor: theme.colors.surface }]}>
                  {showPosterOverlay ? (
                    <View style={styles.posterOverlayContent}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={handleStartVideo}
                      >
                        <AdaptiveGlassView style={[styles.playButton, { backgroundColor: theme.colors.card }]}>
                          <Play color={theme.colors.white} size={24} />
                        </AdaptiveGlassView>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
            {videoMeta ? (
              <Text style={[styles.videoMeta, { color: theme.colors.textSecondary }]}>{videoMeta}</Text>
            ) : null}
            {videoError ? (
              <Text style={[styles.videoError, { color: theme.colors.danger }]}>{videoError}</Text>
            ) : null}
          </View>

          {info.paragraphs.map((paragraph, index) => (
            <View key={index.toString()} style={[styles.infoBlock, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>{paragraph}</Text>
            </View>
          ))}

          <View style={[styles.measurementCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.measurementTitle, { color: theme.colors.textPrimary }]}>
              {info.measurementTitle}
            </Text>
            <Text style={[styles.measurementDescription, { color: theme.colors.textSecondary }]}>
              {info.measurementDescription}
            </Text>
            <View style={styles.thresholdList}>
              {thresholds.map((item) => (
                <View key={item.label} style={styles.thresholdRow}>
                  <View>
                    <Text style={[styles.thresholdLabel, { color: theme.colors.textPrimary }]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.thresholdRange, { color: theme.colors.textSecondary }]}>
                      {item.range}
                    </Text>
                  </View>
                  <Text style={[styles.thresholdDescription, { color: theme.colors.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.infoBlock, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.measurementTitle, { color: theme.colors.textPrimary }]}>
              {info.howItWorksTitle}
            </Text>
            {info.howItWorksBullets.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.bulletText, { color: theme.colors.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={isVideoOpen}
        animationType="fade"
        onRequestClose={handleCloseVideo}
        presentationStyle="fullScreen"
      >
        <View style={styles.fullscreenModal}>
          <VideoView
            player={player}
            style={styles.fullscreenVideo}
            nativeControls
            contentFit="contain"
            fullscreenOptions={{ enable: false }}
            allowsPictureInPicture={false}
          />
          <View
            style={[styles.fullscreenHeader, { paddingTop: insets.top + 8 }]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={handleCloseVideo}
              accessibilityRole="button"
            >
              <X color="#fff" size={22} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 48,
      gap: 16,
    },
    videoCard: {
      borderRadius: 20,
      padding: 16,
    },
    videoTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 8,
    },
    videoDescription: {
      fontSize: 14,
      marginBottom: 16,
      lineHeight: 20,
    },
    videoWrapper: {
      marginTop: 12,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      aspectRatio: 16 / 9,
      width: '100%',
      backgroundColor: theme.mode === 'dark' ? '#0F111A' : '#E6E9F2',
    },
    posterImage: {
      flex: 1,
      width: '100%',
      height: '100%',
      borderRadius: 16,
    },
    posterOverlayContent: {
      flex: 1,
      width: '100%',
      height: '100%',
      padding: 20,
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.08)',
    },
    posterOverlayRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    playButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playLabel: {
      fontSize: 16,
      fontWeight: '600',
    },
    posterFallback: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
    },
    fullscreenModal: {
      flex: 1,
      backgroundColor: '#000',
    },
    fullscreenVideo: {
      flex: 1,
      backgroundColor: '#000',
    },
    fullscreenHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    fullscreenCloseButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    videoMeta: {
      marginTop: 8,
      fontSize: 12,
    },
    videoError: {
      marginTop: 6,
      fontSize: 12,
    },
    infoBlock: {
      borderRadius: 18,
      padding: 16,
    },
    infoText: {
      fontSize: 14,
      lineHeight: 22,
    },
    measurementCard: {
      borderRadius: 20,
      padding: 16,
      gap: 16,
    },
    measurementTitle: {
      fontSize: 16,
      fontWeight: '700',
    },
    measurementDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    thresholdList: {
      gap: 16,
    },
    thresholdRow: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
      padding: 16,
      gap: 8,
    },
    thresholdLabel: {
      fontSize: 14,
      fontWeight: '700',
    },
    thresholdRange: {
      fontSize: 13,
      fontWeight: '600',
    },
    thresholdDescription: {
      fontSize: 13,
      lineHeight: 18,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 12,
    },
    bulletDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
    bulletText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
  });
