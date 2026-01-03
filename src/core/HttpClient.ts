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
		async (config) => await injectToken(config),
		(error) => {
			console.error('Request Error:', error);
			return Promise.reject(error);
		},
	);

	http.interceptors.response.use(
		(response) => {
			console.log('Response Success:', response.status, response.config.url);
			return response;
		},
		(error) => {
			console.error('Response Error:', {
				url: error.config?.url,
				status: error.response?.status,
				data: error.response?.data,
				message: error.message,
			});
			return Promise.reject(error);
		},
	);

	return http;
};

