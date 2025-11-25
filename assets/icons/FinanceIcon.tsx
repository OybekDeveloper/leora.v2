import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const FinanceIcon = ({ 
  size = 24, 
  color = '#FFFFFF', 
  strokeWidth = 2 
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 62 52" fill="none">
      <Path
        d="M53 21H9C5.68629 21 3 23.6863 3 27V43C3 46.3137 5.68629 49 9 49H53C56.3137 49 59 46.3137 59 43V27C59 23.6863 56.3137 21 53 21Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 21V11C3 8.87827 3.84285 6.84344 5.34315 5.34315C6.84344 3.84285 8.87827 3 11 3H47C48.5913 3 50.1174 3.63214 51.2426 4.75736C52.3679 5.88258 53 7.4087 53 9V21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="45"
        cy="35"
        r="3.5"
        fill={color}
      />
    </Svg>
  );
};