import React from 'react';
import Svg, { Ellipse, Circle, SvgProps } from 'react-native-svg';

interface LogoProps extends SvgProps {
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ size = 32, ...props }) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      {...props}
    >
      <Ellipse cx="16" cy="8" rx="4" ry="7" fill="#C9A227" opacity={0.9} />
      <Ellipse cx="24" cy="16" rx="7" ry="4" fill="#C9A227" opacity={0.75} />
      <Ellipse cx="16" cy="24" rx="4" ry="7" fill="#C9A227" opacity={0.6} />
      <Ellipse cx="8" cy="16" rx="7" ry="4" fill="#C9A227" opacity={0.75} />
      <Circle cx="16" cy="16" r="3.5" fill="#C9A227" />
    </Svg>
  );
};

export default Logo;
