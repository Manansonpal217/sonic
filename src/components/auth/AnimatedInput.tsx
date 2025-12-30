import React, { useState, useRef, useEffect } from 'react';
import { Animated, TextInput, StyleSheet, View } from 'react-native';
import { Box } from '../Box';
import { Text } from '../Text';
import { fonts } from '../../style';
import { createScaleAnimation, createShakeAnimation } from '../../Utils/animations';

export interface AnimatedInputProps {
	label: string;
	value: string;
	onChangeText: (text: string) => void;
	placeholder?: string;
	secureTextEntry?: boolean;
	keyboardType?: any;
	autoCapitalize?: any;
	hasError?: boolean;
	errorMessage?: string;
	isRequired?: boolean;
	rightComponent?: React.ReactNode;
	editable?: boolean;
	multiline?: boolean;
	height?: number;
	icon?: React.ReactNode;
	onFocus?: () => void;
	onBlur?: () => void;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
	label,
	value,
	onChangeText,
	placeholder,
	secureTextEntry = false,
	keyboardType = 'default',
	autoCapitalize = 'none',
	hasError = false,
	errorMessage,
	isRequired = false,
	rightComponent,
	editable = true,
	multiline = false,
	height,
	icon,
	onFocus,
	onBlur,
}) => {
	const [isFocused, setIsFocused] = useState(false);
	const focusAnim = useRef(new Animated.Value(0)).current;
	const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
	const shakeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.parallel([
			Animated.timing(focusAnim, {
				toValue: isFocused ? 1 : 0,
				duration: 200,
				useNativeDriver: false,
			}),
			Animated.timing(labelAnim, {
				toValue: isFocused || value ? 1 : 0,
				duration: 200,
				useNativeDriver: false,
			}),
		]).start();
	}, [isFocused, value]);

	useEffect(() => {
		if (hasError) {
			createShakeAnimation(shakeAnim).start();
		}
	}, [hasError]);

	useEffect(() => {
		createScaleAnimation(scaleAnim, 1, 400, 0).start();
	}, []);

	const borderColor = focusAnim.interpolate({
		inputRange: [0, 1],
		outputRange: hasError ? ['#ff6b6b', '#ff6b6b'] : ['#E2E2E2', '#842B25'],
	});

	const labelTop = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [18, -10],
	});

	const labelFontSize = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [15, 12],
	});

	const labelColor = labelAnim.interpolate({
		inputRange: [0, 1],
		outputRange: hasError ? ['#ff6b6b', '#ff6b6b'] : ['#9D9D9D', '#842B25'],
	});

	const handleFocus = () => {
		setIsFocused(true);
		onFocus?.();
	};

	const handleBlur = () => {
		setIsFocused(false);
		onBlur?.();
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					transform: [
						{ scale: scaleAnim },
						{ translateX: shakeAnim },
					],
				},
			]}
		>
			<Animated.View
				style={[
					styles.inputContainer,
					{
						borderColor,
						borderWidth: 2,
						minHeight: height || 56,
					},
				]}
			>
				{icon && (
					<View style={{ position: 'absolute', left: 16, top: 16, zIndex: 10 }}>
						{icon}
					</View>
				)}
				
				<Animated.Text
					style={[
						styles.label,
						{
							top: labelTop,
							fontSize: labelFontSize,
							color: labelColor,
							left: icon ? 48 : 16,
						},
					]}
				>
					{label}
					{isRequired && <Text color="red"> *</Text>}
				</Animated.Text>

				<TextInput
					style={[
						styles.input,
						{
							paddingLeft: icon ? 48 : 16,
							paddingTop: multiline ? 24 : 16,
							height: height || 56,
							textAlignVertical: multiline ? 'top' : 'center',
						},
					]}
					value={value}
					onChangeText={onChangeText}
					onFocus={handleFocus}
					onBlur={handleBlur}
					secureTextEntry={secureTextEntry}
					keyboardType={keyboardType}
					autoCapitalize={autoCapitalize}
					editable={editable}
					multiline={multiline}
					placeholder=""
				/>

				{rightComponent && (
					<View style={{ position: 'absolute', right: 8, top: 8 }}>
						{rightComponent}
					</View>
				)}
			</Animated.View>

			{hasError && errorMessage && (
				<Animated.View style={{ opacity: scaleAnim }}>
					<Text
						color="red"
						fontSize={12}
						fontFamily={fonts.regular}
						marginTop="es"
						marginLeft="es"
					>
						{errorMessage}
					</Text>
				</Animated.View>
			)}
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
		paddingHorizontal: 16,
	},
	inputContainer: {
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		position: 'relative',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	label: {
		position: 'absolute',
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 8,
		fontFamily: fonts.medium,
		zIndex: 1,
	},
	input: {
		fontSize: 15,
		fontFamily: fonts.regular,
		color: '#000000',
		paddingRight: 50,
	},
});

