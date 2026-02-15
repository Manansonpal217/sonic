import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Storage } from './Storage';

const injectToken = async (
	config: AxiosRequestConfig,
): Promise<AxiosRequestConfig> => {
	try {
		const configTmp = { ...config };
		const token = await Storage.get<string>('@auth_token');
		if (token) {
			configTmp.headers = configTmp.headers || {};
			configTmp.headers.authorization = `Bearer ${token}`;
		}
		return configTmp;
	} catch (error) {
		return config;
	}
};

export const getHttpClient = (baseURL: string): AxiosInstance => {
	const http = axios.create({
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		timeout: 30000, // 30 seconds timeout (reduced from 120 seconds)
		baseURL,
	});

	http.interceptors.request.use(
		async (config) => {
			const c = await injectToken(config);
			const url = typeof c.url === 'string' ? c.url : c.baseURL + (c.url || '');
			console.log('[API] Request', (c.method || 'GET').toUpperCase(), url);
			return c;
		},
		(error) => Promise.reject(error),
	);

	http.interceptors.response.use(
		(response) => {
			console.log('[API] Response', response.status, response.config.url);
			return response;
		},
		(error) => Promise.reject(error),
	);

	return http;
};

