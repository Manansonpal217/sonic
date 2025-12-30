// Check if we're running in Expo Go without requiring native modules
export const isExpoGo = () => {
	try {
		// Check for Expo Constants which is always available
		const Constants = require('expo-constants');
		// In Expo Go, executionEnvironment is 'storeClient'
		// In dev client, it's 'standalone' or 'bare'
		return Constants.executionEnvironment === 'storeClient';
	} catch {
		// If expo-constants is not available, assume we're not in Expo Go
		return false;
	}
};

// Check functions - return false for Expo Go, true for dev builds
// These should only be called when we're ready to require modules
export const canUseReanimated = () => {
	// In Expo Go, always return false to prevent require attempts
	if (isExpoGo()) {
		return false;
	}
	// Only check in dev builds
	try {
		const mod = require('react-native-reanimated');
		return mod && mod.default;
	} catch {
		return false;
	}
};

export const canUseDrawerLayout = () => {
	// In Expo Go, always return false
	if (isExpoGo()) {
		return false;
	}
	try {
		require('react-native-drawer-layout');
		return true;
	} catch {
		return false;
	}
};

export const canUseDeviceInfo = () => {
	// In Expo Go, always return false
	if (isExpoGo()) {
		return false;
	}
	try {
		require('react-native-device-info');
		return true;
	} catch {
		return false;
	}
};

