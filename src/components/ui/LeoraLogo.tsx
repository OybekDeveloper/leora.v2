// LeoraLogo.tsx
import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';

// Типы
type LogoSize = 'tiny' | 'small' | 'medium' | 'large';
type LogoVariant = 'gradient' | 'mono' | 'inverted';
type Platform = 'ios' | 'android' | 'macos' | 'windows';

interface SizeConfig {
  width: number;
  height: number;
  vWidth: number;
  vHeight: number;
  hWidth: number;
  hHeight: number;
}

interface ColorConfig {
  vertical: string;
  horizontal: string;
  useGradient: boolean;
}

// Интерфейсы пропсов
export interface LeoraLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
  style?: StyleProp<ViewStyle>;
}

export interface LeoraLogoWithTextProps extends LeoraLogoProps {
  showText?: boolean;
  textStyle?: StyleProp<TextStyle>;
}

export interface LeoraAppIconProps {
  size?: number;
  platform?: Platform;
  style?: StyleProp<ViewStyle>;
}

// Основной компонент логотипа
export const LeoraLogo: React.FC<LeoraLogoProps> = ({ 
  size = 'medium',
  variant = 'gradient',
  style 
}) => {
  // Размеры для разных вариантов
  const sizes: Record<LogoSize, SizeConfig> = {
    tiny: { width: 24, height: 30, vWidth: 5.5, vHeight: 24, hWidth: 21, hHeight: 5.5 },
    small: { width: 32, height: 40, vWidth: 7, vHeight: 32, hWidth: 28, hHeight: 7 },
    medium: { width: 48, height: 60, vWidth: 11, vHeight: 48, hWidth: 42, hHeight: 11 },
    large: { width: 64, height: 80, vWidth: 14.5, vHeight: 64, hWidth: 56, hHeight: 14.5 }
  };

  const { width, height, vWidth, vHeight, hWidth, hHeight } = sizes[size];

  // Цвета в зависимости от варианта
  const getColors = (): ColorConfig => {
    switch (variant) {
      case 'mono':
        return {
          vertical: '#FFFFFF',
          horizontal: '#FFFFFF',
          useGradient: false
        };
      case 'inverted':
        return {
          vertical: '#000000',
          horizontal: '#000000',
          useGradient: false
        };
      default: // gradient
        return {
          vertical: 'url(#verticalGradient)',
          horizontal: 'url(#horizontalGradient)',
          useGradient: true
        };
    }
  };

  const colors = getColors();

  return (
    <View style={style}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {colors.useGradient && (
          <Defs>
            {/* Градиент для вертикальной части */}
            <LinearGradient id="verticalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity="1" />
              <Stop offset="100%" stopColor="rgb(255,255,255)" stopOpacity="0.6" />
            </LinearGradient>
            
            {/* Градиент для горизонтальной части */}
            <LinearGradient id="horizontalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity="1" />
              <Stop offset="100%" stopColor="rgb(255,255,255)" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
        )}
        
        {/* Группа с наклоном */}
        <G transform="skewX(-15)">
          {/* Вертикальная часть */}
          <Rect
            x="0"
            y="0"
            width={vWidth}
            height={vHeight}
            fill={colors.vertical}
          />
          
          {/* Горизонтальная часть */}
          <Rect
            x="0"
            y={vHeight - hHeight}
            width={hWidth}
            height={hHeight}
            fill={colors.horizontal}
          />
        </G>
      </Svg>
    </View>
  );
};

// Горизонтальный логотип с текстом
export const LeoraLogoHorizontal: React.FC<LeoraLogoWithTextProps> = ({ 
  size = 'medium',
  variant = 'gradient',
  showText = true,
  style,
  textStyle
}) => {
  const getFontSize = (): number => {
    switch (size) {
      case 'tiny': return 16;
      case 'small': return 20;
      case 'medium': return 24;
      case 'large': return 32;
      default: return 24;
    }
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 16 }, style]}>
      <LeoraLogo size={size} variant={variant} />
      {showText && (
        <Text
          style={[
            {
              fontSize: getFontSize(),
              fontWeight: '300',
              letterSpacing: 2.4,
              color: variant === 'inverted' ? '#000000' : '#FFFFFF',
            },
            textStyle
          ]}
        >
          LEORA
        </Text>
      )}
    </View>
  );
};

// Вертикальный логотип с текстом
export const LeoraLogoVertical: React.FC<LeoraLogoWithTextProps> = ({ 
  size = 'medium',
  variant = 'gradient',
  showText = true,
  style,
  textStyle
}) => {
  const getFontSize = (): number => {
    switch (size) {
      case 'tiny': return 14;
      case 'small': return 16;
      case 'medium': return 20;
      case 'large': return 24;
      default: return 20;
    }
  };

  return (
    <View style={[{ alignItems: 'center', gap: 12 }, style]}>
      <LeoraLogo size={size} variant={variant} />
      {showText && (
        <Text
          style={[
            {
              fontSize: getFontSize(),
              fontWeight: '300',
              letterSpacing: 2,
              color: variant === 'inverted' ? '#000000' : '#FFFFFF',
            },
            textStyle
          ]}
        >
          LEORA
        </Text>
      )}
    </View>
  );
};

// Иконка приложения
export const LeoraAppIcon: React.FC<LeoraAppIconProps> = ({ 
  size = 1024,
  platform = 'ios',
  style 
}) => {
  const getIconSize = (): LogoSize => {
    if (size > 512) return 'large';
    if (size > 256) return 'medium';
    if (size > 128) return 'small';
    return 'tiny';
  };

  const getBorderRadius = (): number => {
    switch (platform) {
      case 'ios':
      case 'macos':
        return size * 0.2237; // iOS/macOS rounded corners 22.37%
      case 'android':
        return size / 2; // Circular
      default:
        return 0;
    }
  };

  return (
    <View
      style={[
        {
          width: "auto",
          height: "auto",
          borderRadius: getBorderRadius(),
          backgroundColor: '#18181b',
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <LeoraLogo 
        size={getIconSize()} 
        variant="mono" 
      />
    </View>
  );
};

// Экспорт по умолчанию
export default LeoraLogo;