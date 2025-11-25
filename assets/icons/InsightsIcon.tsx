import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const InsightsIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  strokeWidth = 2 
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 60" fill="none">
      <Path
        d="M25 3C19.1652 3 13.5695 5.31785 9.44365 9.44365C5.31785 13.5695 3 19.1652 3 25C3 34 8 41 15 45V51H35V45C42 41 47 34 47 25C47 19.1652 44.6822 13.5695 40.5564 9.44365C36.4306 5.31785 30.8348 3 25 3Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M32 51H18C16.3431 51 15 52.3431 15 54C15 55.6569 16.3431 57 18 57H32C33.6569 57 35 55.6569 35 54C35 52.3431 33.6569 51 32 51Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};