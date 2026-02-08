import React from 'react';
import { ViewStyle } from 'react-native';
import InaraLogoSvg from '../assets/logos/InaraLogo.svg';

export interface LogoProps {
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ width = 120, height = 108, style }) => {
	return <InaraLogoSvg width={width} height={height} style={style} />;
};
