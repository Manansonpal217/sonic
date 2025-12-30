import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { canUseReanimated, canUseDeviceInfo } from '../../Utils/nativeModules';

// Lazy-load native modules only when needed - never require in Expo Go
const getDeviceInfo = () => {
	// In Expo Go, canUseDeviceInfo() will return false, so we never require
	if (!canUseDeviceInfo()) {
		return { getVersion: () => '1.0.0' };
	}
	// Only require if we're sure it's available (development build)
	try {
		return require('react-native-device-info').default;
	} catch {
		return { getVersion: () => '1.0.0' };
	}
};

const getReanimated = () => {
	// In Expo Go, canUseReanimated() will return false
	if (!canUseReanimated()) {
		// Fallback to React Native Animated (always available)
		const RNAnimated = require('react-native').Animated;
		return {
			default: RNAnimated,
			useAnimatedStyle: () => ({}),
			useSharedValue: (val: number) => ({ value: val }),
			withSpring: (val: any) => val,
			withTiming: (val: any) => val,
			withDelay: (delay: number, val: any) => val,
		};
	}
	// Only require if we're sure it's available (development build)
	try {
		return require('react-native-reanimated');
	} catch {
		// Fallback to React Native Animated
		const RNAnimated = require('react-native').Animated;
		return {
			default: RNAnimated,
			useAnimatedStyle: () => ({}),
			useSharedValue: (val: number) => ({ value: val }),
			withSpring: (val: any) => val,
			withTiming: (val: any) => val,
			withDelay: (delay: number, val: any) => val,
		};
	}
};
import { Box } from '../Box';
import { Text } from '../Text';
import { fonts } from '../../style';
import { Pressable } from '../Pressable';
import { Images } from '../../assets';
import { Image } from '../Image';
import { navigate, reset, Route } from '../../navigation/AppNavigation';
import { Storage } from '../../core/Storage';
import { DrawerHeader } from './DrawerHeader';
import { authStore } from '../../stores/AuthStore';
import { authFactory } from '../../factory';
import { DeviceHelper } from '../../helper/DeviceHelper';
import { LogoutPopup } from './LogoutPopup';

export interface DrawersProps {
	onClosePress: () => void;
}

export const DrawersItem: React.FC<DrawersProps> = observer(({
	onClosePress,
}: DrawersProps) => {
	// Check if we can use native modules (lazy check)
	const hasReanimated = canUseReanimated();
	const DeviceInfo = getDeviceInfo();
	
	// Only initialize Reanimated if available
	let Animated: any = null;
	let useAnimatedStyle: any = null;
	let useSharedValue: any = null;
	let withSpring: any = null;
	let withTiming: any = null;
	let withDelay: any = null;
	
	if (hasReanimated) {
		try {
			const Reanimated = getReanimated();
			Animated = Reanimated.default;
			useAnimatedStyle = Reanimated.useAnimatedStyle;
			useSharedValue = Reanimated.useSharedValue;
			withSpring = Reanimated.withSpring;
			withTiming = Reanimated.withTiming;
			withDelay = Reanimated.withDelay;
		} catch {
			// Fallback to React Native
			const RNAnimated = require('react-native').Animated;
			Animated = RNAnimated;
			useAnimatedStyle = () => ({});
			useSharedValue = (val: number) => ({ value: val });
			withSpring = (val: any) => val;
			withTiming = (val: any) => val;
			withDelay = (delay: number, val: any) => val;
		}
	} else {
		// Expo Go fallback - no animations
		const RNAnimated = require('react-native').Animated;
		Animated = RNAnimated;
		useAnimatedStyle = () => ({});
		useSharedValue = (val: number) => ({ value: val });
		withSpring = (val: any) => val;
		withTiming = (val: any) => val;
		withDelay = (delay: number, val: any) => val;
	}

	const [isLogoutVisible, setIsLogoutVisible] = useState(false);
	const [isDeleteVisible, setIsDeleteVisible] = useState(false);

	// Organized menu items into logical groups
	const primaryMenuItems = [
		{
			label: 'All Products',
			onPress: () => {
				onClosePress();
				// navigate({ screenName: Route.ProductList });
			},
			svgName: Images.order,
		},
		{
			label: 'My Orders',
			onPress: () => {
				onClosePress();
				// navigate({ screenName: Route.OrderList });
			},
			svgName: Images.order,
		},
		{
			label: 'My Profile',
			onPress: () => {
				onClosePress();
				// navigate({ screenName: Route.UpdateProfile });
			},
			svgName: Images.order,
		},
	];

	const supportMenuItems = [
		{
			label: 'Help & Support',
			onPress: () => {
				onClosePress();
				// navigate({
				// 	screenName: Route.WebView,
				// 	params: {
				// 		url: 'https://app.sonicjewellersltd.com/help',
				// 		title: 'Help',
				// 	},
				// });
			},
			svgName: Images.order,
		},
		{
			label: 'Contact Us',
			onPress: () => {
				onClosePress();
				// navigate({
				// 	screenName: Route.WebView,
				// 	params: {
				// 		url: 'https://app.sonicjewellersltd.com/contact-us',
				// 		title: 'Contact Us',
				// 	},
				// });
			},
			svgName: Images.order,
		},
		{
			label: 'About Us',
			onPress: () => {
				onClosePress();
				// navigate({
				// 	screenName: Route.WebView,
				// 	params: {
				// 		url: 'https://app.sonicjewellersltd.com/about-us',
				// 		title: 'About Us',
				// 	},
				// });
			},
			svgName: Images.order,
		},
	];

	const accountMenuItems = [
		{
			label: 'Delete Account',
			onPress: async () => {
				onClosePress();
				setIsDeleteVisible(true);
			},
			svgName: Images.order,
			isDestructive: true,
		},
	];

	const logoutApiCall = async () => {
		// const response = await authFactory.logoutApi();
		// if (response.isSuccess) {
		// }
	};

	const handleLogout = async () => {
		onClosePress();
		await authStore.clearLoginData();
		await Storage.remove('@auth_token');
		await logoutApiCall();
		reset({ screenName: Route.Login });
	};

	const deleteAccountApiCall = async () => {
		// const response = await authFactory.deleteAccountApi();
		// if (response.isSuccess) {
		// 	await handleLogout();
		// }
		await handleLogout();
	};

	return (
		<Box flex={1} height="100%" backgroundColor="white" paddingBottom="r">
			<DrawerHeader onClose={onClosePress} />
			
			{/* Primary Menu Section */}
			<Box marginTop="m" paddingBottom="s">
				{primaryMenuItems.map((value, index) => {
					const MenuItem = ({ item, itemIndex }: { item: typeof value; itemIndex: number }) => {
						const translateX = useSharedValue(-50);
						const opacity = useSharedValue(0);
						const scale = useSharedValue(0.9);
						const pressScale = useSharedValue(1);

						useEffect(() => {
							translateX.value = withDelay(itemIndex * 80, withSpring(0, {
								damping: 12,
								stiffness: 100,
							}));
							opacity.value = withDelay(itemIndex * 80, withTiming(1, { duration: 300 }));
							scale.value = withDelay(itemIndex * 80, withSpring(1, {
								damping: 12,
								stiffness: 100,
							}));
						}, []);

						const animatedStyle = useAnimatedStyle(() => ({
							transform: [
								{ translateX: translateX.value },
								{ scale: scale.value * pressScale.value },
							],
							opacity: opacity.value,
						}));

						const handlePressIn = () => {
							pressScale.value = withSpring(0.96, {
								damping: 15,
								stiffness: 300,
							});
						};

						const handlePressOut = () => {
							pressScale.value = withSpring(1, {
								damping: 15,
								stiffness: 300,
							});
						};

						return (
							<Animated.View style={animatedStyle}>
								<Pressable
									onPress={item.onPress}
									onPressIn={handlePressIn}
									onPressOut={handlePressOut}
									flexDirection="row"
									height={52}
									justifyContent="space-between"
									marginHorizontal="r"
									marginBottom="es"
									alignItems="center"
									paddingHorizontal="s"
									borderRadius={8}
									backgroundColor="gray5"
								>
									<Text fontFamily={fonts.medium} fontSize={15} color="black" letterSpacing={0.2}>
										{item.label}
									</Text>
									<Image
										source={Images.rightArrow}
										width={18}
										height={18}
									/>
								</Pressable>
							</Animated.View>
						);
					};

					return <MenuItem key={`primary-${index}`} item={value} itemIndex={index} />;
				})}
			</Box>

			{/* Support Section */}
			<Box marginTop="m" paddingTop="s" paddingBottom="s">
				<Text 
					marginHorizontal="r" 
					marginBottom="s"
					fontFamily={fonts.semiBold} 
					fontSize={12} 
					color="gray"
					letterSpacing={0.5}
					textTransform="uppercase"
				>
					Support
				</Text>
				{supportMenuItems.map((value, index) => {
					const MenuItem = ({ item, itemIndex }: { item: typeof value; itemIndex: number }) => {
						const translateX = useSharedValue(-30);
						const opacity = useSharedValue(0);
						const pressScale = useSharedValue(1);

						useEffect(() => {
							translateX.value = withDelay(itemIndex * 60 + 300, withSpring(0, {
								damping: 12,
								stiffness: 100,
							}));
							opacity.value = withDelay(itemIndex * 60 + 300, withTiming(1, { duration: 300 }));
						}, []);

						const animatedStyle = useAnimatedStyle(() => ({
							transform: [
								{ translateX: translateX.value },
								{ scale: pressScale.value },
							],
							opacity: opacity.value,
						}));

						const handlePressIn = () => {
							pressScale.value = withSpring(0.97, {
								damping: 15,
								stiffness: 300,
							});
						};

						const handlePressOut = () => {
							pressScale.value = withSpring(1, {
								damping: 15,
								stiffness: 300,
							});
						};

						return (
							<Animated.View style={animatedStyle}>
								<Pressable
									onPress={item.onPress}
									onPressIn={handlePressIn}
									onPressOut={handlePressOut}
									flexDirection="row"
									height={48}
									justifyContent="space-between"
									marginHorizontal="r"
									marginBottom="es"
									alignItems="center"
									paddingHorizontal="s"
								>
									<Text fontFamily={fonts.regular} fontSize={14} color="black">
										{item.label}
									</Text>
									<Image
										source={Images.rightArrow}
										width={16}
										height={16}
									/>
								</Pressable>
							</Animated.View>
						);
					};

					return <MenuItem key={`support-${index}`} item={value} itemIndex={index} />;
				})}
			</Box>

			{/* Account Actions Section */}
			{authStore.isLogin() && (
				<Box marginTop="m" paddingTop="s" paddingBottom="s">
					<Text 
						marginHorizontal="r" 
						marginBottom="s"
						fontFamily={fonts.semiBold} 
						fontSize={12} 
						color="gray"
						letterSpacing={0.5}
						textTransform="uppercase"
					>
						Account
					</Text>
					{accountMenuItems.map((value, index) => {
						const MenuItem = ({ item, itemIndex }: { item: typeof value; itemIndex: number }) => {
							const translateX = useSharedValue(-30);
							const opacity = useSharedValue(0);
							const pressScale = useSharedValue(1);

							useEffect(() => {
								translateX.value = withDelay(itemIndex * 60 + 500, withSpring(0, {
									damping: 12,
									stiffness: 100,
								}));
								opacity.value = withDelay(itemIndex * 60 + 500, withTiming(1, { duration: 300 }));
							}, []);

							const animatedStyle = useAnimatedStyle(() => ({
								transform: [
									{ translateX: translateX.value },
									{ scale: pressScale.value },
								],
								opacity: opacity.value,
							}));

							const handlePressIn = () => {
								pressScale.value = withSpring(0.97, {
									damping: 15,
									stiffness: 300,
								});
							};

							const handlePressOut = () => {
								pressScale.value = withSpring(1, {
									damping: 15,
									stiffness: 300,
								});
							};

							return (
								<Animated.View style={animatedStyle}>
									<Pressable
										onPress={item.onPress}
										onPressIn={handlePressIn}
										onPressOut={handlePressOut}
										flexDirection="row"
										height={48}
										justifyContent="space-between"
										marginHorizontal="r"
										marginBottom="es"
										alignItems="center"
										paddingHorizontal="s"
									>
										<Text 
											fontFamily={fonts.regular} 
											fontSize={14} 
											color={item.isDestructive ? "red3" : "black"}
										>
											{item.label}
										</Text>
										<Image
											source={Images.rightArrow}
											width={16}
											height={16}
										/>
									</Pressable>
								</Animated.View>
							);
						};

						return <MenuItem key={`account-${index}`} item={value} itemIndex={index} />;
					})}
				</Box>
			)}

			{authStore.isLogin() && (() => {
				const LogoutButton = () => {
					const translateY = useSharedValue(30);
					const opacity = useSharedValue(0);
					const scale = useSharedValue(1);

					useEffect(() => {
						translateY.value = withDelay(600, withSpring(0, {
							damping: 12,
							stiffness: 100,
						}));
						opacity.value = withDelay(600, withTiming(1, { duration: 300 }));
					}, []);

					const animatedStyle = useAnimatedStyle(() => ({
						transform: [
							{ translateY: translateY.value },
							{ scale: scale.value },
						],
						opacity: opacity.value,
					}));

					const handlePressIn = () => {
						scale.value = withSpring(0.95, {
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
								onPress={() => {
									setIsLogoutVisible(true);
									onClosePress();
								}}
								onPressIn={handlePressIn}
								onPressOut={handlePressOut}
								position="absolute"
								bottom={DeviceHelper.calculateHeightRatio(60)}
								left={0}
								right={0}
								flexDirection="row"
								justifyContent="center"
								alignItems="center"
								marginHorizontal="r"
								borderRadius={10}
								paddingVertical="r"
								backgroundColor="gray5"
								elevation={2}
							>
								<Image source={Images.logout} width={18} height={18} />
								<Text
									paddingStart="s"
									color="black"
									fontSize={15}
									fontFamily={fonts.semiBold}
									letterSpacing={0.3}
								>
									Logout
								</Text>
							</Pressable>
						</Animated.View>
					);
				};

				return <LogoutButton />;
			})()}
			<LogoutPopup
				onLogout={async () => {
					await handleLogout();
					setIsLogoutVisible(false);
				}}
				onClose={() => {
					setIsLogoutVisible(false);
				}}
				title="Logout"
				button1Label="yes Logout"
				button2Label="cancel"
				message="Are you sure you want to logout?"
				isLogout
				Visible={isLogoutVisible}
			/>
			<LogoutPopup
				onLogout={async () => {
					await deleteAccountApiCall();
					setIsDeleteVisible(false);
				}}
				onClose={() => {
					setIsDeleteVisible(false);
				}}
				title="Delete Account"
				button1Label="Delete"
				button2Label="cancel"
				message="Are you sure you want to delete Account?"
				Visible={isDeleteVisible}
			/>
			<Box
				position="absolute"
				bottom={8}
				flexDirection="row"
				alignSelf="center"
				paddingHorizontal="r"
			>
				<Text
					color="gray"
					fontFamily={fonts.regular}
					fontSize={12}
					letterSpacing={0.3}
				>
					Version {DeviceInfo.getVersion()}
				</Text>
			</Box>
		</Box>
	);
});

