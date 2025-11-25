import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const InComingIcon = ({
  size = 24,
  color = '#A6A6B9',
  strokeWidth = 1.5,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M11.0022 7.84365C9.83908 7.84365 8.89697 8.55102 8.89697 9.42259C8.89697 10.2952 9.83908 11.0015 11.0022 11.0015C12.1654 11.0015 13.1075 11.7089 13.1075 12.5805C13.1075 13.4531 12.1643 14.1594 11.0022 14.1594M11.0022 7.84365C11.918 7.84365 12.6991 8.28365 12.9875 8.89628M11.0022 7.84365V6.79102M11.0022 14.1594C10.0864 14.1594 9.30539 13.7205 9.01697 13.1068M11.0022 14.1594V15.2121"
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
        d="M21 1.00051L16.6042 5.39946M15.7368 1.54999L15.8611 4.80472C15.8611 5.57209 16.3189 6.04999 17.1537 6.10999L20.4421 6.26367"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
