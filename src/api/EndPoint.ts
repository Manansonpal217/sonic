import { Platform } from 'react-native';

const PRODUCTION_API = 'https://sonic-db-n7v6t.ondigitalocean.app/app';

function getDevBaseUrl(): string {
	const env = process.env.EXPO_PUBLIC_API_BASE_URL;
	if (env && env.trim()) {
		const base = env.trim().replace(/\/+$/, '');
		return base.includes('/app') ? base : `${base}/app`;
	}
	// iOS Simulator: localhost is your Mac. Android Emulator: 10.0.2.2 is the host.
	// For a physical device, set EXPO_PUBLIC_API_BASE_URL in .env to your machine IP (e.g. http://192.168.1.5:8000/app)
	if (Platform.OS === 'android') return 'http://10.0.2.2:8000/app';
	return 'http://localhost:8000/app';
}

export const BASE_URL = __DEV__ ? getDevBaseUrl() : PRODUCTION_API;

/** Base origin for media and WebSocket (no /app path). e.g. http://localhost:8000 */
export const API_ORIGIN = BASE_URL.replace(/\/app\/?$/, '');

/** Legal URLs for Play Store compliance - override via env if hosted elsewhere */
export const PRIVACY_POLICY_URL =
	(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL || '').trim() ||
	`${API_ORIGIN}/privacy/`;
export const TERMS_URL =
	(process.env.EXPO_PUBLIC_TERMS_URL || '').trim() ||
	`${API_ORIGIN}/terms/`;

/** Web-based account deletion for users who uninstalled the app. Play Store compliance. */
export const ACCOUNT_DELETE_WEB_URL =
	(process.env.EXPO_PUBLIC_ACCOUNT_DELETE_WEB_URL || '').trim() ||
	`${API_ORIGIN}/account-delete/`;
/** Base URL for media assets. e.g. http://localhost:8000/media */
export const MEDIA_BASE_URL = `${API_ORIGIN}/media`;
/** WebSocket base. e.g. ws://localhost:8000 */
export const WS_BASE_URL = API_ORIGIN.replace(/^http/, 'ws');

export const HEALTH = (): string => `${BASE_URL}/health`;
export const LOGIN = (): string => `${BASE_URL}/client-login`;
export const REGISTRATION = (): string => `${BASE_URL}/client-registration`;
export const SEND_OTP = (): string => `${BASE_URL}/send-otp`;
export const VERIFY_OTP = (): string => `${BASE_URL}/verify-otp`;

export const PRODUCT_LIST = (): string => `${BASE_URL}/product-list`;
export const PRODUCT_DETAIL = (): string => `${BASE_URL}/product-details`;
export const PRODUCT_FORM_RESPONSE = (): string => `${BASE_URL}/save-form-response`;
export const DASHBOARD = (): string => `${BASE_URL}/dashboard`;
export const ORDER_LIST = (): string => `${BASE_URL}/client-order-list`;
export const ORDER_DETAIL = (): string => `${BASE_URL}/order-details`;
export const ORDER_ONLY = (): string => `${BASE_URL}/order-only`;
export const CANCEL_ORDER = (): string => `${BASE_URL}/remove-order`;
export const ADD_TO_CART = (): string => `${BASE_URL}/add-to-cart`;
export const ADD_TO_CART_LIST = (): string => `${BASE_URL}/add-to-cart-list`;
export const CART_LIST = (): string => `${BASE_URL}/cart/`;
export const CART_CLEAR = (): string => `${BASE_URL}/cart/clear_cart/`;
export const CHECKOUT_ORDER = (): string => `${BASE_URL}/checkout-order`;
export const FORGOT_PASSWORD = (): string => `${BASE_URL}/forget-pass`;
export const USER_DETAILS = (): string => `${BASE_URL}/user-details`;
export const LOGOUT = (): string => `${BASE_URL}/logout`;
export const NOTIFICATION_LIST = (): string => `${BASE_URL}/noti-list`;
export const UPDATE_PROFILE = (): string => `${BASE_URL}/update-profile`;
export const DELETE_ACCOUNT = (): string => `${BASE_URL}/account-delete`;
export const UPDATE_CART = (): string => `${BASE_URL}/update-cart`;
export const PRODUCT_LEADS = (): string => `${BASE_URL}/product-leads/`;
export const BANNERS_ACTIVE = (): string => `${BASE_URL}/banners/active/`;
export const CATEGORIES_ACTIVE = (): string => `${BASE_URL}/categories/active/`;

