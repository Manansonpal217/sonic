import React, { useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../Text';
import { fonts } from '../../style';
import { createScaleAnimation } from '../../Utils/animations';

export interface AnimatedButtonProps {
	title: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'outline';
	disabled?: boolean;
	loading?: boolean;
	fullWidth?: boolean;
	icon?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
	title,
	onPress,
	variant = 'primary',
	disabled = false,
	loading = false,
	fullWidth = true,
	icon,
}) => {
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const pressAnim = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		createScaleAnimation(scaleAnim, 1, 400, 0).start();
	}, []);

	const handlePressIn = () => {
		Animated.spring(pressAnim, {
			toValue: 0.95,
			useNativeDriver: true,
		}).start();
	};

	const handlePressOut = () => {
		Animated.spring(pressAnim, {
			toValue: 1,
			friction: 3,
			tension: 40,
			useNativeDriver: true,
		}).start();
	};

	const getButtonStyle = () => {
		switch (variant) {
			case 'secondary':
				return {
					backgroundColor: '#F5F5F5',
					borderWidth: 0,
				};
			case 'outline':
				return {
					backgroundColor: 'transparent',
					borderWidth: 2,
					borderColor: '#842B25',
				};
			default:
				return {
					backgroundColor: '#842B25',
					borderWidth: 0,
				};
		}
	};

	const getTextColor = () => {
		if (disabled) return 'gray';
		switch (variant) {
			case 'secondary':
				return 'red3';
			case 'outline':
				return 'red3';
			default:
				return 'white';
		}
	};

	return (
		<Animated.View
			style={[
				styles.container,
				fullWidth && styles.fullWidth,
				{
					transform: [
						{ scale: scaleAnim },
						{ scale: pressAnim },
					],
				},
			]}
		>
			<TouchableOpacity
				style={[
					styles.button,
					getButtonStyle(),
					disabled && styles.disabled,
				]}
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				disabled={disabled || loading}
				activeOpacity={0.8}
			>
				{loading ? (
					<ActivityIndicator color={getTextColor() === 'white' ? '#FFFFFF' : '#842B25'} size="small" />
				) : (
					<>
						{icon && <Animated.View style={styles.icon}>{icon}</Animated.View>}
						<Text
							color={getTextColor()}
							fontSize={16}
							fontFamily={fonts.bold}
						>
							{title}
						</Text>
					</>
				)}
			</TouchableOpacity>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 16,
		marginVertical: 8,
	},
	fullWidth: {
		alignSelf: 'stretch',
	},
	button: {
		height: 56,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		shadowColor: '#842B25',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 5,
	},
	disabled: {
		backgroundColor: '#E2E2E2',
		shadowOpacity: 0,
		elevation: 0,
	},
	icon: {
		marginRight: 8,
	},
});


