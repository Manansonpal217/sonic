import { AxiosInstance, AxiosResponse } from 'axios';
import { Result, success, failure } from './Result';
import { getHttpClient } from './HttpClient';

const GENERIC_ERROR = 'Something went wrong. Please try again.';
const NETWORK_ERROR = 'Unable to connect. Please check your internet and try again.';

function getProductionError(error: any, safeBackendMessage?: string): string {
	const code = error?.code || '';
	const message = (error?.message || '').toLowerCase();
	// Network/connection failures
	if (
		code === 'ECONNREFUSED' ||
		code === 'ETIMEDOUT' ||
		code === 'ERR_NETWORK' ||
		message.includes('network error') ||
		message.includes('timeout')
	) {
		return NETWORK_ERROR;
	}
	// 4xx responses - show backend's user-facing message (already sanitized)
	if (error?.response && error.response.status >= 400 && error.response.status < 500 && safeBackendMessage) {
		return safeBackendMessage;
	}
	return GENERIC_ERROR;
}

function sanitizeUserMessage(raw: unknown): string {
	if (raw == null) return GENERIC_ERROR;
	const str = typeof raw === 'string' ? raw : String(raw);
	// Never show raw API/HTTP or JSON to the user
	if (/HTTP (GET|POST|PUT|PATCH|DELETE) Error/i.test(str)) return GENERIC_ERROR;
	if (str.trim().startsWith('{') && str.includes('"error"')) return GENERIC_ERROR;
	return str;
}

export class Http {
	constructor(private client: AxiosInstance) {}

	async get<T>(url: string, config?: any): Promise<Result<T>> {
		try {
			console.log('HTTP GET:', url, 'Config:', config);
			const response: AxiosResponse<T> = await this.client.get(url, config);
			console.log('HTTP GET Response:', response.status, response.data);
			return success(response.data, response.data?.message as string);
		} catch (error: any) {
			if (__DEV__) {
				// Log full error for debugging network/API issues (e.g. ECONNREFUSED, timeout)
				const url = error.config?.url || error.config?.baseURL || 'unknown';
				console.warn('[API] GET failed:', url, 'code:', error.code, 'message:', error.message);
			}
			const rawMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
			const safeMessage = sanitizeUserMessage(typeof rawMessage === 'string' ? rawMessage : 'Request failed');
			const userMessage = !__DEV__ ? getProductionError(error, safeMessage) : safeMessage;
			return failure(userMessage, error.response?.data?.message);
		}
	}

	async post<T>(url: string, data?: any, config?: any): Promise<Result<T>> {
		try {
			console.log('HTTP POST:', url, 'Data:', data);
			const response: AxiosResponse<T> = await this.client.post(url, data, config);
			console.log('HTTP Response:', response.status, response.data);
			return success(response.data, (response.data as any)?.message as string);
		} catch (error: any) {
			if (__DEV__) {
				const url = error.config?.url || error.config?.baseURL || 'unknown';
				console.warn('[API] POST failed:', url, 'code:', error.code, 'message:', error.message);
			}
			// Handle Django REST Framework validation errors
			let errorMessage = error.response?.data?.message ||
				error.response?.data?.error ||
				error.message ||
				'Request failed';
			if (typeof errorMessage !== 'string') {
				errorMessage = error.response?.data?.error ?? 'Request failed';
			}
			if (error.response?.data?.non_field_errors && Array.isArray(error.response.data.non_field_errors)) {
				errorMessage = error.response.data.non_field_errors[0];
			} else if (error.response?.data && typeof error.response?.data === 'object') {
				const fieldErrors = Object.values(error.response.data).flat();
				if (fieldErrors.length > 0 && typeof fieldErrors[0] === 'string') {
					errorMessage = fieldErrors[0];
				}
			}
			// User-friendly messages for common errors (dev only; production never shows API messages)
			if (__DEV__ && (errorMessage.includes('unique set') || errorMessage.includes('must make a unique'))) {
				errorMessage = 'This item is already in your cart';
			}
			const safeMessage = sanitizeUserMessage(errorMessage);
			const userMessage = !__DEV__ ? getProductionError(error, safeMessage) : safeMessage;
			return failure(userMessage, error.response?.data?.message);
		}
	}

	async put<T>(url: string, data?: any, config?: any): Promise<Result<T>> {
		try {
			const response: AxiosResponse<T> = await this.client.put(url, data, config);
			return success(response.data, response.data?.message as string);
		} catch (error: any) {
			const rawMessage = error.response?.data?.message || error.message || 'Request failed';
			const safeMessage = sanitizeUserMessage(typeof rawMessage === 'string' ? rawMessage : 'Request failed');
			const userMessage = !__DEV__ ? getProductionError(error, safeMessage) : safeMessage;
			return failure(userMessage, error.response?.data?.message);
		}
	}

	async patch<T>(url: string, data?: any, config?: any): Promise<Result<T>> {
		try {
			const response: AxiosResponse<T> = await this.client.patch(url, data, config);
			return success(response.data, (response.data as any)?.message as string);
		} catch (error: any) {
			const errorMessage = error.response?.data?.message ||
				error.response?.data?.error ||
				error.message ||
				'Request failed';
			const safeMessage = sanitizeUserMessage(typeof errorMessage === 'string' ? errorMessage : 'Request failed');
			const userMessage = !__DEV__ ? getProductionError(error, safeMessage) : safeMessage;
			return failure(userMessage, error.response?.data?.message);
		}
	}

	async delete<T>(url: string, config?: any): Promise<Result<T>> {
		try {
			const response: AxiosResponse<T> = await this.client.delete(url, config);
			return success(response.data, response.data?.message as string);
		} catch (error: any) {
			const rawMessage = error.response?.data?.message || error.message || 'Request failed';
			const safeMessage = sanitizeUserMessage(typeof rawMessage === 'string' ? rawMessage : 'Request failed');
			const userMessage = !__DEV__ ? getProductionError(error, safeMessage) : safeMessage;
			return failure(userMessage, error.response?.data?.message);
		}
	}
}

let httpInstance: Http | null = null;

export const initHttpClient = (baseURL: string) => {
	const client = getHttpClient(baseURL);
	httpInstance = new Http(client);
	return httpInstance;
};

export const getHttp = (): Http => {
	if (!httpInstance) {
		throw new Error('Http client not initialized. Call initHttpClient first.');
	}
	return httpInstance;
};

