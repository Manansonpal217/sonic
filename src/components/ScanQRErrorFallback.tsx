import React from 'react';
import { View } from 'react-native';
import { Box, Text, Screen, CommonHeader, Pressable } from './index';
import { goBack } from '../navigation/AppNavigation';
import { fonts } from '../style';

interface ScanQRErrorFallbackProps {
	onRetry?: () => void;
}

/**
 * Shown when Scan QR screen fails to load (e.g. "unknown module" for expo-camera in Expo Go).
 * expo-camera requires a development build; Expo Go may not include the native module.
 */
export const ScanQRErrorFallback: React.FC<ScanQRErrorFallbackProps> = ({ onRetry }) => {
	return (
		<Screen>
			<CommonHeader label="Scan QR Code" onBackPress={goBack} />
			<Box flex={1} padding="xl" justifyContent="center">
				<Text fontSize={20} fontFamily={fonts.bold} marginBottom="m">
					Camera not available
				</Text>
				<Text fontSize={16} marginBottom="lg" textAlign="center">
					QR scanning needs the camera module. Use a development build instead of Expo Go.
				</Text>
				<Text fontSize={16} marginBottom="xl" textAlign="center" color="gray">
					From the project folder run:{'\n'}
					npx expo run:ios{'\n'}
					or npx expo run:android
				</Text>
				<Text fontSize={16} marginBottom="xl" textAlign="center" color="gray">
					Then start Metro with: npx expo start -c
				</Text>
				<Pressable onPress={goBack}>
					<Box backgroundColor="primary" paddingVertical="m" borderRadius={8} alignItems="center">
						<Text color="white" fontFamily={fonts.medium}>
							Go back
						</Text>
					</Box>
				</Pressable>
			</Box>
		</Screen>
	);
};
