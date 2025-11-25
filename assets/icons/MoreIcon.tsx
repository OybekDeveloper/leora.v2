import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const MoreIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  strokeWidth = 2 
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 42 30" fill="none">
      <Path
        d="M3 3H39"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M3 15H39"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M3 27H39"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
};