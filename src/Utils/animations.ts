import { Animated, Easing } from 'react-native';

export const createFadeInAnimation = (
	animatedValue: Animated.Value,
	duration = 600,
	delay = 0
) => {
	return Animated.timing(animatedValue, {
		toValue: 1,
		duration,
		delay,
		easing: Easing.out(Easing.cubic),
		useNativeDriver: true,
	});
};

export const createSlideUpAnimation = (
	animatedValue: Animated.Value,
	duration = 500,
	delay = 0
) => {
	return Animated.timing(animatedValue, {
		toValue: 0,
		duration,
		delay,
		easing: Easing.out(Easing.back(1.2)),
		useNativeDriver: true,
	});
};

export const createScaleAnimation = (
	animatedValue: Animated.Value,
	toValue = 1,
	duration = 400,
	delay = 0
) => {
	return Animated.spring(animatedValue, {
		toValue,
		friction: 6,
		tension: 40,
		delay,
		useNativeDriver: true,
	});
};

export const createShakeAnimation = (animatedValue: Animated.Value) => {
	return Animated.sequence([
		Animated.timing(animatedValue, {
			toValue: 10,
			duration: 100,
			useNativeDriver: true,
		}),
		Animated.timing(animatedValue, {
			toValue: -10,
			duration: 100,
			useNativeDriver: true,
		}),
		Animated.timing(animatedValue, {
			toValue: 10,
			duration: 100,
			useNativeDriver: true,
		}),
		Animated.timing(animatedValue, {
			toValue: 0,
			duration: 100,
			useNativeDriver: true,
		}),
	]);
};


