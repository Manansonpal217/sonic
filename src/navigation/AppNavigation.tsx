import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { authStore } from '../stores/AuthStore';
import { authFactory } from '../factory';
import { showErrorMessage } from '../core';

export enum Route {
	Login = 'Login',
	Registration = 'Registration',
	Dashboard = 'Dashboard',
}

export type RootStackParamList = {
	[Route.Login]: undefined;
	[Route.Registration]: undefined;
	[Route.Dashboard]: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

export const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList> | null) => {
	navigationRef = ref;
};

export const navigate = (params: { screenName: Route; params?: any }) => {
	if (navigationRef?.isReady()) {
		navigationRef.navigate(params.screenName as never, params.params as never);
	}
};

export const reset = (params: { screenName: Route; params?: any }) => {
	if (navigationRef?.isReady()) {
		navigationRef.reset({
			index: 0,
			routes: [{ name: params.screenName, params: params.params }],
		});
	}
};

export const goBack = () => {
	if (navigationRef?.canGoBack()) {
		navigationRef.goBack();
	}
};

export const AppNavigation = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [initialRoute, setInitialRoute] = useState<Route>(Route.Login);

	useEffect(() => {
		const checkAuthAndAutoLogin = async () => {
			try {
				// Wait for auth store to initialize
				await authStore.loadAuthData();

				// Check if user is already logged in
				if (authStore.isLogin()) {
					setInitialRoute(Route.Dashboard);
					setIsLoading(false);
					return;
				}

				// Check if credentials are saved (remember me was checked)
				const savedCredentials = await authStore.getSavedCredentials();
				if (savedCredentials) {
					// Attempt auto-login
					const response = await authFactory.loginApi(
						savedCredentials.email,
						savedCredentials.password
					);

					if (response.isSuccess && response.data) {
						await authStore.setLoginData(
							response.data,
							savedCredentials // Keep credentials saved
						);
						setInitialRoute(Route.Dashboard);
					} else {
						// Auto-login failed, clear saved credentials
						await authStore.clearLoginData();
						setInitialRoute(Route.Login);
					}
				} else {
					setInitialRoute(Route.Login);
				}
			} catch (error) {
				console.error('Error during auto-login:', error);
				setInitialRoute(Route.Login);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuthAndAutoLogin();
	}, []);

	if (isLoading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color="#842B25" />
			</View>
		);
	}

	return (
		<Stack.Navigator
			screenOptions={{
				headerShown: false,
			}}
			initialRouteName={initialRoute}
		>
			<Stack.Screen name={Route.Login} component={LoginScreen} />
			<Stack.Screen name={Route.Registration} component={RegistrationScreen} />
			<Stack.Screen name={Route.Dashboard} component={DashboardScreen} />
		</Stack.Navigator>
	);
};

