import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { View, StyleSheet } from 'react-native';
import { storage } from '@/utils/storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isReady: boolean;
  setTheme: (value: Theme) => void;
  toggleTheme: () => void;
}

// ALWAYS DEFAULT TO DARK - NO SYSTEM THEME
const DEFAULT_THEME: Theme = 'dark';
const THEME_STORAGE_KEY = 'leora:theme';

const ThemeContext = createContext<ThemeContextType>({
  theme: DEFAULT_THEME,
  isReady: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: PropsWithChildren) {
  // Start with dark immediately (no undefined state)
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [isReady, setIsReady] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    const hydrateTheme = async () => {
      try {
        const storedTheme = await storage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'light' || storedTheme === 'dark') {
          if (isMounted.current) {
            setThemeState(storedTheme);
          }
        }
      } catch (error) {
        console.warn('Failed to load theme:', error);
      } finally {
        if (isMounted.current) {
          setIsReady(true);
        }
      }
    };

    hydrateTheme();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const persistTheme = useCallback(async (value: Theme) => {
    try {
      await storage.setItem(THEME_STORAGE_KEY, value);
    } catch (error) {
      console.warn('Failed to persist theme:', error);
    }
  }, []);

  const setTheme = useCallback(
    (value: Theme) => {
      setThemeState(value);
      void persistTheme(value);
    },
    [persistTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      void persistTheme(next);
      return next;
    });
  }, [persistTheme]);

  const contextValue = useMemo(
    () => ({
      theme,
      isReady,
      setTheme,
      toggleTheme,
    }),
    [theme, isReady, setTheme, toggleTheme]
  );

  // Render with dark background immediately
  return (
    <View style={[styles.container, { backgroundColor: theme === 'dark' ? '#000000' : '#FFFFFF' }]}>
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
