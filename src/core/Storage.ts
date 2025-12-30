import AsyncStorage from '@react-native-async-storage/async-storage';

export const Storage = {
	async set(key: string, value: any): Promise<void> {
		try {
			const jsonValue = JSON.stringify(value);
			await AsyncStorage.setItem(key, jsonValue);
		} catch (error) {
			console.error('Storage set error:', error);
			throw error;
		}
	},

	async get<T>(key: string): Promise<T | null> {
		try {
			const jsonValue = await AsyncStorage.getItem(key);
			return jsonValue != null ? JSON.parse(jsonValue) : null;
		} catch (error) {
			console.error('Storage get error:', error);
			return null;
		}
	},

	async remove(key: string): Promise<void> {
		try {
			await AsyncStorage.removeItem(key);
		} catch (error) {
			console.error('Storage remove error:', error);
			throw error;
		}
	},

	async clear(): Promise<void> {
		try {
			await AsyncStorage.clear();
		} catch (error) {
			console.error('Storage clear error:', error);
			throw error;
		}
	},
};


