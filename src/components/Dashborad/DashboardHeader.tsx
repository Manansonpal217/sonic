import React from 'react';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { authStore } from '../../stores/AuthStore';
import { navigate, Route } from '../../navigation/AppNavigation';
import { cartFactory } from '../../factory/CartFactory';

export interface HeaderProps {
	onMenuPress: () => void;
	onNotificationPress: () => void;
	onAddToCartPress: () => void;
	onProfilePress?: () => void;
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
		<Animated.View 
			style={[
				animatedStyle,
				{
					position: 'absolute',
					top: -4,
					right: -4,
					zIndex: 10,
				}
			]}
		>
			<Box 
				height={18} 
				justifyContent="center" 
				alignItems="center" 
				minWidth={18}
				paddingHorizontal="es"
				borderRadius={9} 
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
	onProfilePress,
	label,
	search,
	onSearch,
}: HeaderProps) => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44); // Ensure at least 44px for Dynamic Island
	
	const handleProfilePress = () => {
		if (onProfilePress) {
			onProfilePress();
		} else {
			navigate({ screenName: Route.Profile });
		}
	};

	const handleCartPress = () => {
		navigate({ screenName: Route.Cart });
	};

	const user = authStore?.loginData?.user;
	const [cartCount, setCartCount] = React.useState(0);
	const headerOpacity = useSharedValue(0);
	const headerTranslateY = useSharedValue(-20);

	// Fetch cart count only when component mounts or user login status changes
	React.useEffect(() => {
		const fetchCartCount = async () => {
			if (authStore.isLogin()) {
				try {
					const response = await cartFactory.getCartListApi();
					if (response.isSuccess && response.data) {
						const totalItems = response.data.results?.reduce((sum, item) => sum + item.cart_quantity, 0) || 0;
						setCartCount(totalItems);
					} else {
						setCartCount(0);
					}
				} catch (error) {
					console.error('Failed to fetch cart count:', error);
					setCartCount(0);
				}
			} else {
				setCartCount(0);
			}
		};

		fetchCartCount();
		// Only fetch on mount and when login status changes, not constantly
	}, [authStore.isLogin()]);

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
			<Box backgroundColor="white" paddingBottom="s" style={{ paddingTop: topPadding }}>
				<Box 
					height={64} 
					flexDirection="row" 
					alignItems="center"
					paddingHorizontal="r"
				>
					{/* Hamburger Menu Button */}
					<AnimatedButton onPress={onMenuPress} delay={0}>
						<Box
							justifyContent="center" 
							alignItems="center"
							width={40}
							height={40}
							borderRadius={20}
							backgroundColor="gray5"
							marginEnd="s"
						>
							{/* Three horizontal lines for hamburger menu */}
							<Box>
								<Box
									width={20}
									height={2}
									style={{ backgroundColor: '#000000' }}
									marginBottom="xs"
									borderRadius={1}
								/>
								<Box
									width={20}
									height={2}
									style={{ backgroundColor: '#000000' }}
									marginBottom="xs"
									borderRadius={1}
								/>
								<Box
									width={20}
									height={2}
									style={{ backgroundColor: '#000000' }}
									borderRadius={1}
								/>
							</Box>
						</Box>
					</AnimatedButton>
					
					{/* Logo - positioned right next to hamburger */}
					<Image 
						source={Images.logo} 
						resizeMode="cover" 
						height={50} 
						width={50} 
					/>

					{/* Right side icons - flex to push to the right */}
					<Box flex={1} flexDirection="row" alignItems="center" justifyContent="flex-end">
						<AnimatedButton onPress={onNotificationPress} delay={50}>
							<Box
								justifyContent="center" 
								alignItems="center"
								width={40}
								height={40}
								borderRadius={20}
								backgroundColor="gray5"
								marginEnd="s"
								position="relative"
							>
								<Image source={Images.notification} height={20} width={20} />
								<AnimatedBadge 
									count={0} 
									visible={false}
								/>
							</Box>
						</AnimatedButton>
						
						{/* Cart Icon - before avatar */}
						<AnimatedButton onPress={handleCartPress} delay={100}>
							<Box
								justifyContent="center" 
								alignItems="center"
								width={40}
								height={40}
								borderRadius={20}
								backgroundColor="gray5"
								marginEnd="s"
								style={{ position: 'relative', overflow: 'visible' }}
							>
								<Image source={Images.shopping} height={20} width={20} />
								<AnimatedBadge 
									count={cartCount} 
									visible={cartCount > 0}
								/>
							</Box>
						</AnimatedButton>

						{/* Avatar Button */}
						<AnimatedButton onPress={handleProfilePress} delay={150}>
							{authStore.isLogin() && user?.profilePic ? (
								<Image
									source={{ uri: user.profilePic }}
									height={40}
									width={40}
									borderRadius={20}
								/>
							) : (
								<Box
									justifyContent="center" 
									alignItems="center"
									width={40}
									height={40}
									borderRadius={20}
									backgroundColor="red3"
								>
									<Text
										fontSize={18}
										fontFamily={fonts.bold}
										color="white"
									>
										{user?.userName?.charAt(0)?.toUpperCase() || 'U'}
									</Text>
								</Box>
							)}
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

