import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Box, Text, Screen, CommonHeader, Pressable } from '../components';
import { goBack, navigate, Route } from '../navigation/AppNavigation';
import { fonts } from '../style';

export const ScanQRScreen: React.FC = () => {
	const [permission, requestPermission] = useCameraPermissions();
	const [scanned, setScanned] = useState(false);

	const handleBarcodeScanned = useCallback(
		({ data }: { data: string }) => {
			if (scanned) return;
			setScanned(true);
			try {
				const parsed = JSON.parse(data) as { productId?: number };
				const productId = parsed?.productId;
				if (typeof productId === 'number' && productId > 0) {
					navigate({
						screenName: Route.LeadForm,
						params: { productId },
					});
				} else {
					Alert.alert('Invalid QR', 'This QR code is not a valid product code.');
					setScanned(false);
				}
			} catch {
				// Maybe URL format like sonic://product/123
				const match = data.match(/product[/:](\d+)/i);
				if (match) {
					const productId = parseInt(match[1], 10);
					navigate({
						screenName: Route.LeadForm,
						params: { productId },
					});
				} else {
					Alert.alert('Invalid QR', 'This QR code is not a valid product code.');
					setScanned(false);
				}
			}
		},
		[scanned]
	);

	if (!permission) {
		return (
			<Screen>
				<CommonHeader label="Scan QR Code" onBackPress={goBack} />
				<Box flex={1} justifyContent="center" alignItems="center" padding="xl">
					<Text variant="body">Requesting camera access...</Text>
					<ActivityIndicator size="large" style={{ marginTop: 16 }} />
				</Box>
			</Screen>
		);
	}

	if (!permission.granted) {
		return (
			<Screen>
				<CommonHeader label="Scan QR Code" onBackPress={goBack} />
				<Box flex={1} justifyContent="center" alignItems="center" padding="xl">
					<Text variant="body" textAlign="center" marginBottom="l">
						Camera permission is required to scan product QR codes.
					</Text>
					<Pressable onPress={requestPermission}>
						<Box backgroundColor="primary" paddingHorizontal="xl" paddingVertical="m" borderRadius={8}>
							<Text color="white" fontFamily={fonts.medium}>
								Grant permission
							</Text>
						</Box>
					</Pressable>
				</Box>
			</Screen>
		);
	}

	return (
		<Screen>
			<CommonHeader label="Scan QR Code" onBackPress={goBack} />
			<Box flex={1} padding="m">
				<Text variant="body" marginBottom="m">
					Point your camera at a product QR code.
				</Text>
				<Box flex={1} overflow="hidden" borderRadius={12} style={styles.cameraWrap}>
					<CameraView
						style={StyleSheet.absoluteFill}
						onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
						barcodeScannerSettings={{
							barcodeTypes: ['qr'],
						}}
					/>
				</Box>
				{scanned && (
					<Pressable
						onPress={() => setScanned(false)}
						style={{ marginTop: 16 }}
					>
						<Box backgroundColor="primary" paddingVertical="m" borderRadius={8} alignItems="center">
							<Text color="white" fontFamily={fonts.medium}>
								Tap to scan again
							</Text>
						</Box>
					</Pressable>
				)}
			</Box>
		</Screen>
	);
};

const styles = StyleSheet.create({
	cameraWrap: {
		minHeight: 300,
	},
});
