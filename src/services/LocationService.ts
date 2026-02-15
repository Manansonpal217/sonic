import * as Location from 'expo-location';
import { getHttp } from '../core/Http';
import { UPDATE_LOCATION } from '../api/EndPoint';
import { UpdateLocationApiParams, UpdateLocationApiResponse } from '../api/LocationApi';

export interface LocationData {
	latitude: number;
	longitude: number;
	address?: string;
}

class LocationService {
	private lastUpdateTime: number = 0;
	private updateInterval: number = 5 * 60 * 1000; // 5 minutes

	/**
	 * Request location permissions
	 */
	async requestPermissions(): Promise<boolean> {
		try {
			const { status } = await Location.requestForegroundPermissionsAsync();
			return status === 'granted';
		} catch (error) {
			return false;
		}
	}

	/**
	 * Get current location
	 */
	async getCurrentLocation(): Promise<LocationData | null> {
		try {
			const hasPermission = await this.requestPermissions();
			if (!hasPermission) {
				console.warn('Location permission not granted');
				return null;
			}

			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			let address: string | undefined;
			try {
				// Reverse geocode to get address
				const addresses = await Location.reverseGeocodeAsync({
					latitude: location.coords.latitude,
					longitude: location.coords.longitude,
				});

				if (addresses && addresses.length > 0) {
					const addr = addresses[0];
					address = [
						addr.street,
						addr.city,
						addr.region,
						addr.country,
					].filter(Boolean).join(', ');
				}
			} catch (error) {
				console.warn('Error reverse geocoding:', error);
			}

			return {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
				address,
			};
		} catch (error) {
			return null;
		}
	}

	/**
	 * Update location to backend
	 */
	async updateLocation(location?: LocationData): Promise<boolean> {
		try {
			const locationData = location || await this.getCurrentLocation();
			if (!locationData) {
				return false;
			}

			const params: UpdateLocationApiParams = {
				latitude: locationData.latitude,
				longitude: locationData.longitude,
				address: locationData.address,
			};

			const http = getHttp();
			const result = await http.post<UpdateLocationApiResponse>(UPDATE_LOCATION(), params);

			if (result.isSuccess) {
				this.lastUpdateTime = Date.now();
				return true;
			}

			return false;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Update location if enough time has passed since last update
	 */
	async updateLocationIfNeeded(): Promise<boolean> {
		const now = Date.now();
		if (now - this.lastUpdateTime < this.updateInterval) {
			return false; // Too soon to update
		}

		return await this.updateLocation();
	}

	/**
	 * Start periodic location updates
	 */
	startPeriodicUpdates(interval: number = 5 * 60 * 1000): void {
		this.updateInterval = interval;
		setInterval(() => {
			this.updateLocationIfNeeded();
		}, interval);
	}
}

export const locationService = new LocationService();
