import { AxiosInstance, AxiosResponse } from 'axios';
import { Result, success, failure } from './Result';
import { getHttpClient } from './HttpClient';

export class Http {
	constructor(private client: AxiosInstance) {}

	async get<T>(url: string, config?: any): Promise<Result<T>> {
		try {
			const response: AxiosResponse<T> = await this.client.get(url, config);
			return success(response.data, response.data?.message as string);
		} catch (error: any) {
			return failure(
				error.response?.data?.message || error.message || 'Request failed',
				error.response?.data?.message,
			);
		}
	}

	async post<T>(url: string, data?: any, config?: any): Promise<Result<T>> {
		try {
			console.log('HTTP POST:', url, 'Data:', data);
			const response: AxiosResponse<T> = await this.client.post(url, data, config);
			console.log('HTTP Response:', response.status, response.data);
			return success(response.data, (response.data as any)?.message as string);
		} catch (error: any) {
			console.error('HTTP POST Error:', error.response?.data || error.message);
			const errorMessage = error.response?.data?.message || 
				error.response?.data?.error || 
				error.message || 
				'Request failed';
			return failure(errorMessage, error.response?.data?.message);
		}
	}

	async put<T>(url: string, data?: any, config?: any): Promise<Result<T>> {
		try {
			const response: AxiosResponse<T> = await this.client.put(url, data, config);
			return success(response.data, response.data?.message as string);
		} catch (error: any) {
			return failure(
				error.response?.data?.message || error.message || 'Request failed',
				error.response?.data?.message,
			);
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
			return failure(errorMessage, error.response?.data?.message);
		}
	}

	async delete<T>(url: string, config?: any): Promise<Result<T>> {
		try {
			const response: AxiosResponse<T> = await this.client.delete(url, config);
			return success(response.data, response.data?.message as string);
		} catch (error: any) {
			return failure(
				error.response?.data?.message || error.message || 'Request failed',
				error.response?.data?.message,
			);
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

