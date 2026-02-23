import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { ThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigation, setNavigationRef, RootStackParamList } from './src/navigation/AppNavigation';
import theme from './src/style/Theme';
import { initHttpClient, getHttp } from './src/core';
import { BASE_URL, HEALTH } from './src/api/EndPoint';

// Initialize API client before any screen runs so getHttp() never throws
initHttpClient(BASE_URL);

// Log API base so we can confirm what the app is using (check Metro terminal)
console.log('[API] BASE_URL =', BASE_URL);

export default function App() {
	const [fontsLoaded] = useFonts({
		'NunitoSans_7pt-Regular': require('./src/assets/fonts/NunitoSans_7pt-Regular.ttf'),
		'NunitoSans_7pt-Bold': require('./src/assets/fonts/NunitoSans_7pt-Bold.ttf'),
		'NunitoSans_7pt-SemiBold': require('./src/assets/fonts/NunitoSans_7pt-SemiBold.ttf'),
		'NunitoSans_7pt-Medium': require('./src/assets/fonts/NunitoSans_7pt-Medium.ttf'),
		'NunitoSans_7pt-Light': require('./src/assets/fonts/NunitoSans_7pt-Light.ttf'),
		'NunitoSans_7pt-Italic': require('./src/assets/fonts/NunitoSans_7pt-Italic.ttf'),
		'NunitoSans_7pt-LightItalic': require('./src/assets/fonts/NunitoSans_7pt-LightItalic.ttf'),
	});

	const [navigationReady, setNavigationReady] = useState(false);

	// One-time health check so we see in Metro if the backend is reachable
	useEffect(() => {
		const healthUrl = HEALTH();
		console.log('[API] Health check GET', healthUrl);
		getHttp()
			.get(healthUrl)
			.then((r) => {
				if (r.isSuccess) console.log('[API] Health check OK', r.data);
				else console.warn('[API] Health check failed:', r.error);
			})
			.catch((e) => console.error('[API] Health check error:', e?.message ?? e));
	}, []);

	if (!fontsLoaded) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
				<ActivityIndicator size="large" color="#842B25" />
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ThemeProvider theme={theme}>
				<StatusBar style="auto" />
				<NavigationContainer
				ref={(ref: NavigationContainerRef<RootStackParamList> | null) => {
					setNavigationRef(ref);
					if (ref && !navigationReady) {
						setNavigationReady(true);
					}
				}}
			>
				<AppNavigation />
				</NavigationContainer>
			</ThemeProvider>
		</GestureHandlerRootView>
	);
}
