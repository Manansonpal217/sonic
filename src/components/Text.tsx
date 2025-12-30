import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../style/Theme';
import { fonts } from '../style';

export interface TextProps extends RNTextProps {
	fontSize?: number;
	color?: keyof Theme['colors'] | string;
	fontFamily?: string;
	textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
	lineHeight?: number;
	marginBottom?: keyof Theme['spacing'] | number;
	marginTop?: keyof Theme['spacing'] | number;
	marginLeft?: keyof Theme['spacing'] | number;
	marginRight?: keyof Theme['spacing'] | number;
	letterSpacing?: number;
	flex?: number;
}

export const Text: React.FC<TextProps> = ({
	fontSize = 14,
	color = 'black',
	fontFamily = fonts.regular,
	textAlign,
	lineHeight,
	marginBottom,
	marginTop,
	marginLeft,
	marginRight,
	letterSpacing,
	flex,
	style,
	...props
}) => {
	const theme = useTheme<Theme>();
	
	const textColor = typeof color === 'string' && color in theme.colors 
		? theme.colors[color as keyof Theme['colors']]
		: color;

	const getSpacing = (spacing?: keyof Theme['spacing'] | number) => {
		if (!spacing) return undefined;
		if (typeof spacing === 'number') return spacing;
		return theme.spacing[spacing];
	};

	return (
		<RNText
			style={[
				{
					fontSize,
					color: textColor,
					fontFamily,
					textAlign,
					lineHeight,
					marginBottom: getSpacing(marginBottom),
					marginTop: getSpacing(marginTop),
					marginLeft: getSpacing(marginLeft),
					marginRight: getSpacing(marginRight),
					letterSpacing,
					flex,
				},
				style,
			]}
			{...props}
		/>
	);
};

