import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const LightIcon = ({
  size = 18,
  color = '#FEA900',
  strokeWidth = 0.7,
}: IconProps) => {
  const aspectRatio = 19 / 18;
  const width = size * aspectRatio;

  return (
    <Svg width={width} height={size} viewBox="0 0 19 18" fill="none">
      <Path
        d="M4.08678 11.3992C3.73094 10.651 3.54732 9.8417 3.54773 9.02347C3.54773 5.87592 6.20644 3.32422 9.48643 3.32422C12.7664 3.32422 15.4251 5.87677 15.4251 9.02432C15.4254 9.84227 15.2418 10.6512 14.8861 11.3992"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M9.48644 0.349609V1.19961M18.6229 8.84962H17.7093M1.26362 8.84962H0.349976M15.9459 2.83841L15.3 3.43936M3.67291 3.44021L3.02696 2.83926M11.7861 15.0597C12.7089 14.7818 13.0798 13.9955 13.184 13.205C13.215 12.9687 13.0058 12.7724 12.75 12.7724H6.26766C6.20519 12.7714 6.14322 12.7829 6.08585 12.8059C6.02848 12.8289 5.97702 12.863 5.93487 12.9059C5.89272 12.9488 5.86085 12.9996 5.84135 13.0548C5.82186 13.11 5.8152 13.1685 5.8218 13.2263C5.92413 14.0151 6.18178 14.5922 7.15938 15.0597M11.7861 15.0597H7.15938M11.7861 15.0597C11.6755 16.713 11.1621 17.3675 9.49284 17.3488C7.70757 17.3794 7.29643 16.5702 7.15938 15.0597"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
