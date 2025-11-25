import Svg, { Defs, ClipPath, Rect, G, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const CheckIcon = ({
  size = 24,
  color = '#7E8491',
  strokeWidth = 1.5,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 15" fill="none">
      <Defs>
        <ClipPath id="check_clip">
          <Rect width="14" height="14" x={0} y={0.5} fill="white" />
        </ClipPath>
      </Defs>
      <G clipPath="url(#check_clip)">
        <Path
          d="M0.5 9.0498L3.23 12.5598C3.32212 12.6795 3.44016 12.7768 3.57525 12.8443C3.71034 12.9119 3.85898 12.9479 4.01 12.9498C4.15859 12.9515 4.3057 12.9201 4.44063 12.8578C4.57555 12.7956 4.6949 12.704 4.79 12.5898L13.5 2.0498"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
