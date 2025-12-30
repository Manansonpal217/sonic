// export const BASE_URL = 'https://api.sonicjewellersltd.in/app'; // live

// Configuration for local development
// For iOS Simulator: use 'http://localhost:8000/app'
// For Android Emulator: use 'http://10.0.2.2:8000/app'
// For Physical Devices: use your machine's IP (e.g., 'http://10.87.231.72:8000/app')
export const BASE_URL = __DEV__ 
	? 'http://10.87.231.72:8000/app' // Using your machine's IP for physical device testing
	: 'https://api.sonicjewellersltd.in/app'; // production

export const LOGIN = (): string => `${BASE_URL}/client-login`;
export const REGISTRATION = (): string => `${BASE_URL}/client-registration`;
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
export const CHECKOUT_ORDER = (): string => `${BASE_URL}/checkout-order`;
export const FORGOT_PASSWORD = (): string => `${BASE_URL}/forget-pass`;
export const USER_DETAILS = (): string => `${BASE_URL}/user-details`;
export const LOGOUT = (): string => `${BASE_URL}/logout`;
export const NOTIFICATION_LIST = (): string => `${BASE_URL}/noti-list`;
export const UPDATE_PROFILE = (): string => `${BASE_URL}/update-profile`;
export const DELETE_ACCOUNT = (): string => `${BASE_URL}/account-delete`;
export const UPDATE_CART = (): string => `${BASE_URL}/update-cart`;

