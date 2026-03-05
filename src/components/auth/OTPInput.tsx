import React, { useRef, useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, Animated } from 'react-native';
import { Text } from '../Text';
import { fonts, palette } from '../../style';
import { createScaleAnimation } from '../../Utils/animations';

export interface OTPInputProps {
	value: string;
	onChangeText: (text: string) => void;
	length?: number;
	hasError?: boolean;
	errorMessage?: string;
}

export const OTPInput: React.FC<OTPInputProps> = ({
	value,
	onChangeText,
	length = 6,
	hasError = false,
	errorMessage,
}) => {
	const inputRefs = useRef<(TextInput | null)[]>([]);
	const scaleAnim = useRef(new Animated.Value(0)).current;
	const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

	useEffect(() => {
		createScaleAnimation(scaleAnim, 1, 400, 0).start();
	}, []);

	useEffect(() => {
		// Focus the first empty input
		const firstEmptyIndex = value.length;
		if (firstEmptyIndex < length) {
			inputRefs.current[firstEmptyIndex]?.focus();
		}
	}, [value, length]);

	const handleChangeText = (text: string, index: number) => {
		// Only allow numeric input
		const numericText = text.replace(/[^0-9]/g, '');
		
		if (numericText.length > 1) {
			// Handle paste: take only the first character
			const newValue = value.split('');
			newValue[index] = numericText[0];
			onChangeText(newValue.join('').substring(0, length));
			
			// Focus next input if available
			if (index < length - 1) {
				inputRefs.current[index + 1]?.focus();
			}
		} else if (numericText.length === 1) {
			// Single character input
			const newValue = value.split('');
			newValue[index] = numericText;
			onChangeText(newValue.join('').substring(0, length));
			
			// Focus next input if available
			if (index < length - 1 && value.length <= index) {
				inputRefs.current[index + 1]?.focus();
			}
		} else {
			// Delete character
			const newValue = value.split('');
			newValue[index] = '';
			onChangeText(newValue.join(''));
			
			// Focus previous input if available
			if (index > 0) {
				inputRefs.current[index - 1]?.focus();
			}
		}
	};

	const handleKeyPress = (key: string, index: number) => {
		if (key === 'Backspace' && !value[index] && index > 0) {
			// Move to previous input on backspace if current is empty
			inputRefs.current[index - 1]?.focus();
		}
	};

	const getBorderColor = (index: number) => {
		if (hasError) return '#ff6b6b';
		if (focusedIndex === index) return palette.primary;
		return '#E5E3E0';
	};

	return (
		<Animated.View
			style={[
				styles.container,
				{
					transform: [{ scale: scaleAnim }],
				},
			]}
		>
			<View style={styles.inputContainer}>
				{Array.from({ length }).map((_, index) => (
					<TextInput
						key={index}
						ref={(ref) => {
							inputRefs.current[index] = ref;
						}}
						style={[
							styles.input,
							{
								borderColor: getBorderColor(index),
							},
						]}
						value={value[index] || ''}
						onChangeText={(text) => handleChangeText(text, index)}
						onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
						onFocus={() => setFocusedIndex(index)}
						onBlur={() => setFocusedIndex(null)}
						keyboardType="number-pad"
						maxLength={1}
						selectTextOnFocus
					/>
				))}
			</View>

			{hasError && errorMessage && (
				<Text
					color="red"
					fontSize={12}
					fontFamily={fonts.regular}
					marginTop="es"
					textAlign="center"
				>
					{errorMessage}
				</Text>
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
		flexDirection: 'row',
		justifyContent: 'space-between',
		gap: 12,
	},
	input: {
		flex: 1,
		height: 56,
		borderWidth: 2,
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		fontSize: 24,
		fontFamily: fonts.bold,
		color: '#000000',
		textAlign: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
});
