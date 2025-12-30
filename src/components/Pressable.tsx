import React from 'react';
import { Pressable as RNPressable, PressableProps as RNPressableProps, StyleSheet } from 'react-native';
import { Box } from './Box';
import { Theme } from '../style/Theme';

export interface PressableProps extends RNPressableProps {
	justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
	alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
	height?: number;
	width?: number;
}

export const Pressable: React.FC<PressableProps> = ({
	justifyContent,
	alignItems,
	height,
	width,
	style,
	...props
}) => {
	return (
		<RNPressable
			style={({ pressed }) => [
				{
					justifyContent,
					alignItems,
					height,
					width,
					opacity: pressed ? 0.7 : 1,
				},
				typeof style === 'function' ? style({ pressed }) : style,
			]}
			{...props}
		/>
	);
};


