import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const DiagramIcon = ({
  size = 24,
  color = '#A6A6B9',
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M12.8 12.8H9.6V3.2H12.8V12.8ZM10.6667 4.26667V11.7333H11.7333V4.26667H10.6667ZM8.53333 12.8H5.33333V5.33333H8.53333V12.8ZM6.4 6.4V11.7333H7.46667V6.4H6.4ZM1.06667 0H16V16H1.06667V12.8H0V11.7333H1.06667V5.33333H0V4.26667H1.06667V0ZM14.9333 14.9333V1.06667H2.13333V4.26667H3.2V5.33333H2.13333V11.7333H3.2V12.8H2.13333V14.9333H14.9333Z"
        fill={color}
      />
    </Svg>
  );
};
