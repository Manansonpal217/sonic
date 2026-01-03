import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Box, Text } from './';
import { fonts } from '../style';

interface ToastProps {
	message: string;
	type?: 'success' | 'error';
	visible: boolean;
	onHide: () => void;
	duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
	message,
	type = 'success',
	visible,
	onHide,
	duration = 3000,
}) => {
	const opacity = useRef(new Animated.Value(0)).current;
	const translateY = useRef(new Animated.Value(100)).current; // Start from bottom (100 instead of -100)

	useEffect(() => {
		if (visible) {
			// Show animation from bottom
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.spring(translateY, {
					toValue: 0,
					useNativeDriver: true,
					tension: 50,
					friction: 7,
				}),
			]).start();

			// Auto hide after duration
			const timer = setTimeout(() => {
				hideToast();
			}, duration);

			return () => clearTimeout(timer);
		} else {
			hideToast();
		}
	}, [visible]);

	const hideToast = () => {
		Animated.parallel([
			Animated.timing(opacity, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: 100, // Hide to bottom
				duration: 200,
				useNativeDriver: true,
			}),
		]).start(() => {
			onHide();
		});
	};

	if (!visible) return null;

	return (
		<View style={styles.container} pointerEvents="none">
			<Animated.View
				style={[
					styles.toast,
					{
						opacity,
						transform: [{ translateY }],
						backgroundColor: type === 'success' ? '#842B25' : '#F44336', // Use red3 color for success
					},
				]}
			>
				<Box
					flexDirection="row"
					alignItems="center"
					paddingHorizontal="m"
					paddingVertical="s"
				>
					<Text
						fontSize={14}
						fontFamily={fonts.semiBold}
						color="white"
						flex={1}
						textAlign="center"
					>
						{message}
					</Text>
				</Box>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		alignItems: 'center',
		zIndex: 9999,
		paddingBottom: 20,
	},
	toast: {
		borderRadius: 12,
		marginHorizontal: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
		minWidth: 200,
		maxWidth: '90%',
	},
});

