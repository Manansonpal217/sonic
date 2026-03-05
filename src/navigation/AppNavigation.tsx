import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState, Suspense } from 'react';
import { NavigationContainerRef } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { LoginScreen } from '../screens/LoginScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CartScreen } from '../screens/CartScreen';
import { NotificationScreen } from '../screens/NotificationScreen';
import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderConfirmationScreen } from '../screens/OrderConfirmationScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { ApprovalPendingScreen } from '../screens/ApprovalPendingScreen';
import { authStore } from '../stores/AuthStore';
import { ScanQRErrorBoundary } from '../components/ScanQRErrorBoundary';

// Lazy-load screens that use expo-camera so the app entry can register without loading native camera at startup
const ScanQRScreen = React.lazy(() =>
	import('../screens/ScanQRScreen').then((m) => ({ default: m.ScanQRScreen }))
);
const LeadFormScreen = React.lazy(() =>
	import('../screens/LeadFormScreen').then((m) => ({ default: m.LeadFormScreen }))
);

const ScreenFallback = () => (
	<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
		<ActivityIndicator size="large" color="#842B25" />
	</View>
);

function ScanQRScreenWrapper(props: any) {
	return (
		<ScanQRErrorBoundary>
			<Suspense fallback={<ScreenFallback />}>
				<ScanQRScreen {...props} />
			</Suspense>
		</ScanQRErrorBoundary>
	);
}

function LeadFormScreenWrapper(props: any) {
	return (
		<Suspense fallback={<ScreenFallback />}>
			<LeadFormScreen {...props} />
		</Suspense>
	);
}

import { authFactory } from '../factory';
import { showErrorMessage } from '../core';
import { CartItem } from '../api/CartApi';

export enum Route {
	Login = 'Login',
	Registration = 'Registration',
	ApprovalPending = 'ApprovalPending',
	Dashboard = 'Dashboard',
	Profile = 'Profile',
	Cart = 'Cart',
	Notification = 'Notification',
	ProductList = 'ProductList',
	ProductDetail = 'ProductDetail',
	Checkout = 'Checkout',
	OrderConfirmation = 'OrderConfirmation',
	Orders = 'Orders',
	OrderDetail = 'OrderDetail',
	ScanQR = 'ScanQR',
	LeadForm = 'LeadForm',
}

export type RootStackParamList = {
	[Route.Login]: undefined;
	[Route.Registration]: undefined;
	[Route.ApprovalPending]: undefined;
	[Route.Dashboard]: undefined;
	[Route.Profile]: undefined;
	[Route.Cart]: undefined;
	[Route.Notification]: undefined;
	[Route.ProductList]: { categoryId?: number; categoryName?: string };
	[Route.ProductDetail]: { productId?: number };
	[Route.Checkout]: { cartItems?: CartItem[]; isSingleItemCheckout?: boolean };
	[Route.OrderConfirmation]: { order: any };
	[Route.Orders]: undefined;
	[Route.OrderDetail]: { orderId: number };
	[Route.ScanQR]: undefined;
	[Route.LeadForm]: { productId: number; productName?: string };
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
		const AUTH_CHECK_TIMEOUT_MS = 8000; // Don't block app if API is slow/unreachable

		const checkAuthAndAutoLogin = async () => {
			const timeoutPromise = new Promise<void>((resolve) => {
				setTimeout(() => resolve(), AUTH_CHECK_TIMEOUT_MS);
			});

			const authPromise = (async () => {
				try {
					// Wait for auth store to initialize
					await authStore.loadAuthData();

					// Check if user is already logged in
					if (authStore.isLogin()) {
						setInitialRoute(authStore.isApproved() ? Route.Dashboard : Route.ApprovalPending);
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
							setInitialRoute(authStore.isApproved() ? Route.Dashboard : Route.ApprovalPending);
						} else {
							// Auto-login failed, clear saved credentials
							await authStore.clearLoginData();
							setInitialRoute(Route.Login);
						}
					} else {
						setInitialRoute(Route.Login);
					}
				} catch (error) {
					setInitialRoute(Route.Login);
				}
			})();

			// Whichever finishes first (auth completes or timeout)
			await Promise.race([authPromise, timeoutPromise]);
			setIsLoading(false);
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
			<Stack.Screen name={Route.ApprovalPending} component={ApprovalPendingScreen} />
			<Stack.Screen name={Route.Dashboard} component={DashboardScreen} />
			<Stack.Screen name={Route.Profile} component={ProfileScreen} />
			<Stack.Screen name={Route.Cart} component={CartScreen} />
			<Stack.Screen name={Route.Notification} component={NotificationScreen} />
			<Stack.Screen name={Route.ProductList} component={ProductListScreen} />
			<Stack.Screen name={Route.ProductDetail} component={ProductDetailScreen} />
			<Stack.Screen name={Route.Checkout} component={CheckoutScreen} />
			<Stack.Screen name={Route.OrderConfirmation} component={OrderConfirmationScreen} />
			<Stack.Screen name={Route.Orders} component={OrdersScreen} />
			<Stack.Screen name={Route.OrderDetail} component={OrderDetailScreen} />
			<Stack.Screen name={Route.ScanQR} component={ScanQRScreenWrapper} />
			<Stack.Screen name={Route.LeadForm} component={LeadFormScreenWrapper} />
		</Stack.Navigator>
	);
};

