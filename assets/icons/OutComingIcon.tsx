import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const OutComingIcon = ({
  size = 24,
  color = '#A6A6B9',
  strokeWidth = 1.5,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11.0022 7.84267C9.83908 7.84267 8.89697 8.55004 8.89697 9.42162C8.89697 10.2942 9.83908 11.0006 11.0022 11.0006C12.1654 11.0006 13.1075 11.7079 13.1075 12.5795C13.1075 13.4521 12.1643 14.1585 11.0022 14.1585M11.0022 7.84267C11.918 7.84267 12.6991 8.28267 12.9875 8.8953M11.0022 7.84267V6.79004M11.0022 14.1585C10.0864 14.1585 9.30539 13.7195 9.01697 13.1058M11.0022 14.1585V15.2111"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M12.5789 1.00098H11C6.28632 1.00098 3.92842 1.00098 2.46421 2.46624C1 3.9315 1 6.28729 1 10.9999C1 15.7126 1 18.0715 2.46421 19.5368C3.92842 20.9999 6.28526 20.9999 11 20.9999C15.7137 20.9999 18.0716 20.9999 19.5358 19.5368C21 18.0715 21 15.7157 21 10.9999V9.42098"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M15.7368 6.26316L20.1326 1.86421M21 5.71368L20.8758 2.45895C20.8758 1.69158 20.4179 1.21368 19.5831 1.15368L16.2947 1"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
