import React from "react";
import { View, StyleSheet } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children }) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {children}
      </View>
    </View>
  );
};

export default GlassCard;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "rgba(45, 45, 55, 0.4)", // juda shaffof quyuq fon
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", // juda nozik och border
    // Box Shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});