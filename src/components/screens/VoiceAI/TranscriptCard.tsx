import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TranscriptCardProps {
  transcript: string;
}

export const TranscriptCard: React.FC<TranscriptCardProps> = ({ transcript }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>РАСПОЗНАНО</Text>
      <Text style={styles.text}>{transcript}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 2,
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});

