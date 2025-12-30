import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

// Conditional imports for react-native-reanimated
let Animated: any = null;
let useAnimatedStyle: any = null;
let useSharedValue: any = null;
let withSpring: any = null;
let withTiming: any = null;
let withDelay: any = null;

try {
	const Reanimated = require('react-native-reanimated');
	Animated = Reanimated.default;
	useAnimatedStyle = Reanimated.useAnimatedStyle;
	useSharedValue = Reanimated.useSharedValue;
	withSpring = Reanimated.withSpring;
	withTiming = Reanimated.withTiming;
	withDelay = Reanimated.withDelay;
} catch {
	// Fallback to React Native Animated
	const RNAnimated = require('react-native').Animated;
	Animated = RNAnimated;
	useAnimatedStyle = () => ({});
	useSharedValue = (val: number) => ({ value: val });
	withSpring = (val: any) => val;
	withTiming = (val: any) => val;
	withDelay = (delay: number, val: any) => val;
}
import { Box } from '../Box';
import { Image, Text } from '../';
import { DeviceHelper } from '../../helper/DeviceHelper';
import { Images } from '../../assets';
import { fonts } from '../../style';
import { authStore } from '../../stores/AuthStore';

export interface DrawerHeaderProps {
	onClose: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = observer(
	({ onClose }: DrawerHeaderProps) => {
		const avatarScale = useSharedValue(0);
		const avatarOpacity = useSharedValue(0);
		const contentTranslateX = useSharedValue(-30);
		const contentOpacity = useSharedValue(0);
		const headerOpacity = useSharedValue(0);

		useEffect(() => {
			headerOpacity.value = withTiming(1, { duration: 300 });
			avatarScale.value = withDelay(100, withSpring(1, {
				damping: 10,
				stiffness: 100,
			}));
			avatarOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
			contentTranslateX.value = withDelay(200, withSpring(0, {
				damping: 12,
				stiffness: 100,
			}));
			contentOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
		}, []);

		const avatarStyle = useAnimatedStyle(() => ({
			transform: [{ scale: avatarScale.value }],
			opacity: avatarOpacity.value,
		}));

		const contentStyle = useAnimatedStyle(() => ({
			transform: [{ translateX: contentTranslateX.value }],
			opacity: contentOpacity.value,
		}));

		const headerStyle = useAnimatedStyle(() => ({
			opacity: headerOpacity.value,
		}));

		return (
			<Animated.View style={headerStyle}>
				<Box
					height={0}
					backgroundColor="white"
				>
				</Box>
			</Animated.View>
		);
	},
);

