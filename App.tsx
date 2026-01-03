import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { ThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppNavigation, setNavigationRef, RootStackParamList } from './src/navigation/AppNavigation';
import theme from './src/style/Theme';
import { initHttpClient } from './src/core';
import { BASE_URL } from './src/api/EndPoint';

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

	// Initialize HTTP client synchronously before app renders (like in working commit)
	// This ensures HTTP client is ready before any components try to use it
	useEffect(() => {
		initHttpClient(BASE_URL);
	}, []);

	if (!fontsLoaded) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
				<ActivityIndicator size="large" color="#842B25" />
			</View>
		);
	}

	return (
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
	);
}
