import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const DeviceHelper = {
	isAndroid: () => Platform.OS === 'android',
	isIOS: () => Platform.OS === 'ios',
	calculateHeightRatio: (designHeight: number) => {
		const designWidth = 375; // Standard design width
		const ratio = height / width;
		return designHeight * ratio;
	},
	calculateWidthRatio: (designWidth: number) => {
		const standardWidth = 375; // Standard design width
		return (width / standardWidth) * designWidth;
	},
	width: () => width,
	height: () => height,
	getScreenWidth: () => width,
	getScreenHeight: () => height,
};

