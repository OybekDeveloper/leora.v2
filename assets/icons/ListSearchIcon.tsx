import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const ListSearchIcon = ({
  size = 24,
  color = '#A6A6B9',
  strokeWidth = 1.5,
}: IconProps) => {
  // original viewBox is 18x15 → keep aspect ratio when sizing
  const height = (size * 15) / 18;

  return (
    <Svg width={size} height={height} viewBox="0 0 18 15" fill="none">
      <Path
        d="M16.3187 1.38379H1M6.95728 7.34107H1M6.95728 13.2983H1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.9144 12.4471C14.3245 12.4471 15.4676 11.304 15.4676 9.89394C15.4676 8.48389 14.3245 7.34082 12.9144 7.34082C11.5044 7.34082 10.3613 8.48389 10.3613 9.89394C10.3613 11.304 11.5044 12.4471 12.9144 12.4471Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.3186 13.2986L14.7017 11.6816"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
