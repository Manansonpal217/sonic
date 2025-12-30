import React from 'react';
import { Pressable, PressableProps } from './Pressable';
import { Text } from './Text';
import { fonts } from '../style';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
	label: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
	label,
	onPress,
	variant = 'primary',
	...props
}) => {
	return (
		<Pressable
			onPress={onPress}
			backgroundColor={variant === 'primary' ? 'red3' : 'gray5'}
			paddingVertical="s"
			paddingHorizontal="m"
			borderRadius={8}
			marginHorizontal="xs"
			{...props}
		>
			<Text
				fontFamily={fonts.semiBold}
				fontSize={15}
				color={variant === 'primary' ? 'white' : 'black'}
				textAlign="center"
			>
				{label}
			</Text>
		</Pressable>
	);
};


