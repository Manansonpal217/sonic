import React from 'react';
import { observer } from 'mobx-react-lite';

// Conditional imports for react-native-reanimated
let Animated: any = null;
let useAnimatedStyle: any = null;
let useSharedValue: any = null;
let withSpring: any = null;
let withTiming: any = null;

try {
	const Reanimated = require('react-native-reanimated');
	Animated = Reanimated.default;
	useAnimatedStyle = Reanimated.useAnimatedStyle;
	useSharedValue = Reanimated.useSharedValue;
	withSpring = Reanimated.withSpring;
	withTiming = Reanimated.withTiming;
} catch {
	// Fallback to React Native Animated
	const RNAnimated = require('react-native').Animated;
	Animated = RNAnimated;
	useAnimatedStyle = () => ({});
	useSharedValue = (val: number) => ({ value: val });
	withSpring = (val: any) => val;
	withTiming = (val: any) => val;
}
import { Box } from '../Box';
import { Image } from '../Image';
import { Images } from '../../assets';
import { Text } from '../Text';
import { Pressable } from '../Pressable';
import { Search } from '../Search';
import { fonts } from '../../style';

export interface HeaderProps {
	onMenuPress: () => void;
	onNotificationPress: () => void;
	onAddToCartPress: () => void;
	label: string;
	onSearch: (text: string) => void;
	search: string;
}

const AnimatedButton: React.FC<{
	onPress: () => void;
	children: React.ReactNode;
	delay?: number;
}> = ({ onPress, children, delay = 0 }) => {
	const scale = useSharedValue(1);
	const opacity = useSharedValue(0);

	React.useEffect(() => {
		opacity.value = withTiming(1, { duration: 300 }, () => {
			// Animation complete
		});
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	const handlePressIn = () => {
		scale.value = withSpring(0.9, {
			damping: 15,
			stiffness: 300,
		});
	};

	const handlePressOut = () => {
		scale.value = withSpring(1, {
			damping: 15,
			stiffness: 300,
		});
	};

	return (
		<Animated.View style={animatedStyle}>
			<Pressable
				onPress={onPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
			>
				{children}
			</Pressable>
		</Animated.View>
	);
};

const AnimatedBadge: React.FC<{
	count: number;
	visible: boolean;
}> = ({ count, visible }) => {
	const scale = useSharedValue(0);
	const opacity = useSharedValue(0);

	React.useEffect(() => {
		if (visible) {
			scale.value = withSpring(1, {
				damping: 8,
				stiffness: 200,
			});
			opacity.value = withTiming(1, { duration: 200 });
		} else {
			scale.value = withSpring(0, {
				damping: 8,
				stiffness: 200,
			});
			opacity.value = withTiming(0, { duration: 200 });
		}
	}, [visible, count]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	if (!visible) return null;

	return (
		<Animated.View style={animatedStyle}>
			<Box 
				height={18} 
				position="absolute" 
				justifyContent="center" 
				alignItems="center" 
				minWidth={18}
				paddingHorizontal="es"
				borderRadius={9} 
				top={-2} 
				right={-2} 
				backgroundColor="red3"
				borderWidth={2}
				borderColor="white"
			>
				<Text 
					textAlign="center" 
					fontSize={10} 
					fontFamily={fonts.semiBold}
					color="white"
				>
					{count > 99 ? '99+' : count}
				</Text>
			</Box>
		</Animated.View>
	);
};

export const DashboardHeader: React.FC<HeaderProps> = observer(({
	onNotificationPress,
	onMenuPress,
	onAddToCartPress,
	label,
	search,
	onSearch,
}: HeaderProps) => {
	const headerOpacity = useSharedValue(0);
	const headerTranslateY = useSharedValue(-20);

	React.useEffect(() => {
		headerOpacity.value = withTiming(1, { duration: 400 });
		headerTranslateY.value = withSpring(0, {
			damping: 12,
			stiffness: 100,
		});
	}, []);

	const headerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: headerOpacity.value,
		transform: [{ translateY: headerTranslateY.value }],
	}));

	return (
		<Animated.View style={headerAnimatedStyle}>
			<Box backgroundColor="white" paddingBottom="s">
				<Box 
					height={64} 
					flexDirection="row" 
					alignItems="center"
					paddingHorizontal="r"
					paddingTop="s"
				>
					<AnimatedButton onPress={onMenuPress} delay={0}>
						<Box
							justifyContent="center" 
							alignItems="center"
							width={40}
							height={40}
							borderRadius={20}
							backgroundColor="gray5"
						>
							<Image source={Images.menu} height={22} width={22} />
						</Box>
					</AnimatedButton>
					
					<Box flex={1} alignItems="center" paddingHorizontal="s">
						<Image 
							source={Images.logo} 
							resizeMode="cover" 
							height={50} 
							width={50} 
						/>
					</Box>

					<Box flexDirection="row" alignItems="center">
						<AnimatedButton onPress={onNotificationPress} delay={50}>
							<Box
								justifyContent="center" 
								alignItems="center"
								width={40}
								height={40}
								borderRadius={20}
								backgroundColor="gray5"
								marginEnd="s"
							>
								<Image source={Images.notification} height={20} width={20} />
							</Box>
						</AnimatedButton>
						
						<AnimatedButton onPress={onAddToCartPress} delay={100}>
							<Box
								justifyContent="center" 
								alignItems="center"
								width={40}
								height={40}
								borderRadius={20}
								backgroundColor="gray5"
								position="relative"
							>
								<Image source={Images.shopping} height={20} width={20} />
								<AnimatedBadge 
									count={0} 
									visible={false}
								/>
							</Box>
						</AnimatedButton>
					</Box>
				</Box>
				<Box paddingHorizontal="r" paddingTop="s" paddingBottom="s">
					<Search value={search} onChangeText={onSearch} />
				</Box>
			</Box>
		</Animated.View>
	);
});

