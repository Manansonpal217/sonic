import { makeAutoObservable, runInAction } from 'mobx';
import { Storage } from '../core/Storage';

const STORAGE_KEY = '@auth_data';
const SAVED_CREDENTIALS_KEY = '@saved_credentials';

export interface LoginData {
	token: string;
	user?: any;
}

export interface SavedCredentials {
	email: string;
	password: string;
}

class AuthStore {
	loginData: LoginData | null = null;
	isInitialized = false;

	constructor() {
		makeAutoObservable(this);
		this.loadAuthData();
	}

	async loadAuthData() {
		try {
			const data = await Storage.get<LoginData>(STORAGE_KEY);
			if (data) {
				runInAction(() => {
					this.loginData = data;
				});
			}
		} catch (error) {
			console.error('Error loading auth data:', error);
		} finally {
			runInAction(() => {
				this.isInitialized = true;
			});
		}
	}

	async setLoginData(data: LoginData, credentials: SavedCredentials | null = null) {
		runInAction(() => {
			this.loginData = data;
		});
		await Storage.set(STORAGE_KEY, data);
		// Also store token separately for HTTP client
		await Storage.set('@auth_token', data.token);
		
		// Save credentials if remember me is checked
		if (credentials) {
			await Storage.set(SAVED_CREDENTIALS_KEY, credentials);
		} else {
			// Remove saved credentials if remember me is not checked
			await Storage.remove(SAVED_CREDENTIALS_KEY);
		}
	}

	async clearLoginData() {
		runInAction(() => {
			this.loginData = null;
		});
		await Storage.remove(STORAGE_KEY);
		await Storage.remove('@auth_token');
		await Storage.remove(SAVED_CREDENTIALS_KEY);
	}

	async getSavedCredentials(): Promise<SavedCredentials | null> {
		try {
			const credentials = await Storage.get<SavedCredentials>(SAVED_CREDENTIALS_KEY);
			return credentials;
		} catch (error) {
			console.error('Error loading saved credentials:', error);
			return null;
		}
	}

	isLogin(): boolean {
		return !!this.loginData?.token;
	}

	async loginAgain() {
		// Check if token exists and is valid
		const token = await Storage.get<string>('@auth_token');
		if (token) {
			const data = await Storage.get<LoginData>(STORAGE_KEY);
			if (data) {
				runInAction(() => {
					this.loginData = data;
				});
			}
		}
	}
}

export const authStore = new AuthStore();


