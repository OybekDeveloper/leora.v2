import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const HomeIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  strokeWidth = 2 
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 48" fill="none">
      <Path
        d="M3 24L25 3L47 24"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 24V45H43V24"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 36L21 31L29 38L37 29"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};