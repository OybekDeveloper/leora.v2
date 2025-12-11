import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";

import { useAppTheme, type Theme } from "@/constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      marginVertical: 10,
    },
    card: {
      backgroundColor: theme.colors.glassBg,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.glassBorder,
      shadowColor: theme.colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
  });

const GlassCard: React.FC<GlassCardProps> = ({ children }) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
};

export default GlassCard;
