import React from 'react';
import { ViewStyle } from 'react-native';
import InaraLogoWordmark from '../assets/logos/InaraLogoWordmark.svg';

export interface LogoProps {
	width?: number;
	height?: number;
	style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ width = 120, height = 108, style }) => {
	return <InaraLogoWordmark width={width} height={height} style={style} />;
};
