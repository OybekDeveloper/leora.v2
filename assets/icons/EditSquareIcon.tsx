import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
}

export const EditSquareIcon = ({
  size = 24,
  color = '#A6A6B9',
  strokeWidth = 1.5,
  opacity = 0.7,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <G opacity={opacity}>
        <Path
          d="M7.63286 1.73438H2.47397C2.08305 1.73438 1.70814 1.88967 1.43172 2.16609C1.15529 2.44251 1 2.81742 1 3.20834V13.5261C1 13.9171 1.15529 14.292 1.43172 14.5684C1.70814 14.8448 2.08305 15.0001 2.47397 15.0001H12.7918C13.1827 15.0001 13.5576 14.8448 13.834 14.5684C14.1104 14.292 14.2657 13.9171 14.2657 13.5261V8.36724"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12.3313 1.4579C12.6245 1.16471 13.0221 1 13.4368 1C13.8514 1 14.2491 1.16471 14.5422 1.4579C14.8354 1.75109 15.0002 2.14875 15.0002 2.56338C15.0002 2.97802 14.8354 3.37567 14.5422 3.66886L7.89981 10.312C7.72481 10.4869 7.50862 10.6149 7.27116 10.6842L5.1538 11.3033C5.09038 11.3218 5.02316 11.3229 4.95917 11.3065C4.89518 11.2901 4.83677 11.2568 4.79006 11.2101C4.74335 11.1634 4.71005 11.105 4.69366 11.041C4.67726 10.977 4.67837 10.9098 4.69687 10.8464L5.31594 8.729C5.3856 8.49172 5.51384 8.27579 5.68885 8.10109L12.3313 1.4579Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
