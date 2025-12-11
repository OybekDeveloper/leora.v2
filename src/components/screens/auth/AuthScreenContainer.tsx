import React, { useMemo } from 'react';
import {
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Moon } from 'lucide-react-native';

import { useAppTheme, type Theme } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface AuthScreenContainerProps {
  children: React.ReactNode;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    background: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      width: '100%',
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 4,
      paddingHorizontal: 4,
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.glassBg,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeTogglePressed: {
      opacity: 0.7,
    },
    scrollView: {
      flex: 1,
      width: '100%',
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingBottom: 32,
    },
    authHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 16,
      width: '100%',
      gap: 12,
    },
    logo: {
      width: 60,
      height: 80,
    },
    logoTitle: {
      color: theme.colors.textSecondary,
      fontWeight: '200',
      fontSize: 48,
      letterSpacing: 3,
      textAlign: 'center',
    },
    logoTextContainer: {
      alignItems: 'center',
    },
    logoSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    content: {
      width: '100%',
      alignItems: 'center',
      gap: 8,
    },
  });

export const AuthScreenContainer = ({ children }: AuthScreenContainerProps) => {
  const appTheme = useAppTheme();
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(appTheme), [appTheme]);
  const isDark = theme === 'dark';

  return (
    <ImageBackground
      source={require('@assets/images/authBackground.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Theme Toggle */}
        <View style={styles.header}>
          <Pressable
            onPress={toggleTheme}
            style={({ pressed }) => [
              styles.themeToggle,
              pressed && styles.themeTogglePressed,
            ]}
          >
            {isDark ? (
              <Sun size={20} color={appTheme.colors.textPrimary} />
            ) : (
              <Moon size={20} color={appTheme.colors.textPrimary} />
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authHeader}>
            <Image
              source={require('@assets/images/icon.png')}
              style={styles.logo}
            />
            <View style={styles.logoTextContainer}>
              <Text style={styles.logoSubtitle}>MANAGE YOUR LIFE WITH</Text>
              <Text style={styles.logoTitle}>LEORA</Text>
            </View>
          </View>

          <View style={styles.content}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};
