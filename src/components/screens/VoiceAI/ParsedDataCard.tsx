import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { ParsedData } from '@/types/voice-ai.types';

interface ParsedDataCardProps {
  data: ParsedData;
}

export const ParsedDataCard: React.FC<ParsedDataCardProps> = ({ data }) => {
  const getTypeConfig = () => {
    switch (data.type) {
      case 'expense':
        return { icon: '—', label: 'Расход' };
      case 'income':
        return { icon: '+', label: 'Доход' };
      case 'transfer':
        return { icon: '⇄', label: 'Перевод' };
      case 'debt_given':
        return { icon: '↗', label: 'Долг выдан' };
      default:
        return { icon: '•', label: 'Операция' };
    }
  };

  const config = getTypeConfig();

  // Динамически показываем все поля из data
  const renderDetails = () => {
    const excludeKeys = ['type', 'amount', 'description'];
    const detailKeys = Object.keys(data).filter(key => 
      !excludeKeys.includes(key) && data[key] !== undefined && data[key] !== null
    );

    return detailKeys.map(key => (
      <View key={key} style={styles.detailRow}>
        <Text style={styles.detailLabel}>
          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
        </Text>
        <Text style={styles.detailValue}>{String(data[key])}</Text>
      </View>
    ));
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topGradient}
      />
      
      <View style={styles.headerSection}>
        <View style={styles.headerLeft}>
          <View style={styles.typeIcon}>
            <Text style={styles.typeIconText}>{config.icon}</Text>
          </View>
          <View>
            <Text style={styles.typeLabel}>{config.label}</Text>
            <Text style={styles.aiLabel}>AI обработано</Text>
          </View>
        </View>
        <Zap color="rgba(255,255,255,0.6)" size={20} />
      </View>

      {data.amount && (
        <View style={styles.amountSection}>
          <Text style={styles.amountText}>{data.amount}</Text>
        </View>
      )}

      <View style={styles.detailsContainer}>
        {renderDetails()}
      </View>

      <View style={styles.aiHintContainer}>
        <View style={styles.aiHintIcon}>
          <Zap color="#FFFFFF" size={16} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiHintTitle}>AI АНАЛИЗ</Text>
          <Text style={styles.aiHintDescription}>
            Автоматически определены тип операции, категория и счет на основе вашей истории
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeIconText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  typeLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  amountSection: {
    paddingVertical: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  amountText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  detailsContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
    zIndex: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  aiHintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    zIndex: 10,
  },
  aiHintIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiHintTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 4,
  },
  aiHintDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
});