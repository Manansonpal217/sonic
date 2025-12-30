import React, { useEffect } from 'react';
import { ThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import theme from './src/style/Theme';
import { AppNavigation, setNavigationRef } from './src/navigation/AppNavigation';
import { initHttpClient } from './src/core';
import { BASE_URL } from './src/api/EndPoint';
import { authStore } from './src/stores/AuthStore';

// Initialize HTTP client synchronously before app renders
initHttpClient(BASE_URL);

export default function App() {
	useEffect(() => {
		// Load auth data
		authStore.loadAuthData();
	}, []);

	const [fontsLoaded] = useFonts({
		'NunitoSans_7pt-Regular': require('./src/assets/fonts/NunitoSans_7pt-Regular.ttf'),
		'NunitoSans_7pt-Bold': require('./src/assets/fonts/NunitoSans_7pt-Bold.ttf'),
		'NunitoSans_7pt-SemiBold': require('./src/assets/fonts/NunitoSans_7pt-SemiBold.ttf'),
		'NunitoSans_7pt-Medium': require('./src/assets/fonts/NunitoSans_7pt-Medium.ttf'),
		'NunitoSans_7pt-Light': require('./src/assets/fonts/NunitoSans_7pt-Light.ttf'),
		'NunitoSans_7pt-Italic': require('./src/assets/fonts/NunitoSans_7pt-Italic.ttf'),
		'NunitoSans_7pt-LightItalic': require('./src/assets/fonts/NunitoSans_7pt-LightItalic.ttf'),
	});

	if (!fontsLoaded) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color="#842B25" />
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider theme={theme}>
					<NavigationContainer ref={setNavigationRef}>
						<AppNavigation />
					</NavigationContainer>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}


