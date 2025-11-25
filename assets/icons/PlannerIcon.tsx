import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const PlannerIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  strokeWidth = 3 
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 62 48" fill="none">
      <Path
        d="M51 11H11C6.58172 11 3 14.5817 3 19V37C3 41.4183 6.58172 45 11 45H51C55.4183 45 59 41.4183 59 37V19C59 14.5817 55.4183 11 51 11Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 3V13M43 3V13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 19H59"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M27 29L33 35L45 25"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};