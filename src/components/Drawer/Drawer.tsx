import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigationState } from '@react-navigation/native';
import { canUseReanimated, canUseDeviceInfo } from '../../Utils/nativeModules';

// Lazy-load native modules only when needed
const getDeviceInfo = () => {
	if (!canUseDeviceInfo()) {
		return { getVersion: () => '1.0.0' };
	}
	try {
		return require('react-native-device-info').default;
	} catch {
		return { getVersion: () => '1.0.0' };
	}
};

const getReanimated = () => {
	if (!canUseReanimated()) {
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
	try {
		return require('react-native-reanimated');
	} catch {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHttp } from '../../core';
import { Category } from '../../api/CategoryApi';
import { BASE_URL } from '../../api/EndPoint';

export interface DrawersProps {
	onClosePress: () => void;
}

export const DrawersItem: React.FC<DrawersProps> = observer(({
	onClosePress,
}: DrawersProps) => {
	// Check if we can use native modules
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
			const RNAnimated = require('react-native').Animated;
			Animated = RNAnimated;
			useAnimatedStyle = () => ({});
			useSharedValue = (val: number) => ({ value: val });
			withSpring = (val: any) => val;
			withTiming = (val: any) => val;
			withDelay = (delay: number, val: any) => val;
		}
	} else {
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
	const [categories, setCategories] = useState<Category[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState(true);
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44); // Ensure at least 44px for Dynamic Island
	const bottomPadding = Math.max(insets.bottom, 20); // Safe area padding for bottom

	// Get current route for active state indicator
	const currentRoute = useNavigationState(state => {
		const route = state?.routes[state?.index];
		return route?.name;
	});

	// Fetch categories with timeout handling
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				setCategoriesLoading(true);
				const http = getHttp();
				
				// Try active endpoint first (faster, returns array)
				// Use full URL like cart endpoints do
				try {
					const categoriesUrl = `${BASE_URL}/categories/active/`;
					console.log('Fetching categories from:', categoriesUrl);
					const result = await http.get<any>(categoriesUrl);
					
					console.log('Categories response:', {
						isSuccess: result?.isSuccess,
						hasData: !!result?.data,
						error: result?.error,
					});
					
					if (result && result.isSuccess && result.data) {
						// Active endpoint returns array directly, not paginated
						const categoryList = Array.isArray(result.data) ? result.data : (result.data.results || []);
						console.log('Loaded categories:', categoryList.length);
						setCategories(categoryList);
						setCategoriesLoading(false);
						return;
					}
				} catch (activeError: any) {
					// If active endpoint fails, try fallback
					console.warn('Active categories endpoint failed, trying fallback...', activeError?.message);
				}

				// Fallback to regular endpoint with status filter
				try {
					const fallbackUrl = `${BASE_URL}/categories/?category_status=true&page_size=100`;
					console.log('Trying fallback categories URL:', fallbackUrl);
					const fallbackResult = await http.get<any>(fallbackUrl);
					
					if (fallbackResult && fallbackResult.isSuccess && fallbackResult.data) {
						const categoryList = fallbackResult.data.results || fallbackResult.data || [];
						setCategories(categoryList);
					} else {
						setCategories([]);
					}
				} catch (fallbackError: any) {
					// If both fail, try without filter as last resort
					try {
						const lastResortUrl = `${BASE_URL}/categories/`;
						console.log('Trying last resort categories URL:', lastResortUrl);
						const lastResortResult = await http.get<any>(lastResortUrl);
						
						if (lastResortResult && lastResortResult.isSuccess && lastResortResult.data) {
							const categoryList = lastResortResult.data.results || lastResortResult.data || [];
							// Filter active categories client-side
							const activeCategories = Array.isArray(categoryList) 
								? categoryList.filter((cat: any) => cat.category_status !== false)
								: [];
							setCategories(activeCategories);
						} else {
							setCategories([]);
						}
					} catch (lastError: any) {
						console.warn('All category endpoints failed:', lastError?.message);
						setCategories([]);
					}
				}
			} catch (error: any) {
				console.warn('Category fetch error:', error?.message);
				setCategories([]);
			} finally {
				setCategoriesLoading(false);
			}
		};

		fetchCategories();
	}, []);

	// Minimal menu items with route mapping
	const primaryMenuItems = [
		{
			label: 'Dashboard',
			route: Route.Dashboard,
			onPress: () => {
				onClosePress();
				navigate({ screenName: Route.Dashboard });
			},
			svgName: Images.order,
			isPrimary: true,
		},
		{
			label: 'My Orders',
			route: Route.Orders,
			onPress: () => {
				onClosePress();
				navigate({ screenName: Route.Orders });
			},
			svgName: Images.order,
			isPrimary: true,
		},
		{
			label: 'About Us',
			route: 'AboutUs', // Placeholder
			onPress: () => {
				onClosePress();
				// navigate({ screenName: Route.AboutUs });
			},
			svgName: Images.order,
			isPrimary: false,
		},
		{
			label: 'Contact Us',
			route: 'ContactUs', // Placeholder
			onPress: () => {
				onClosePress();
				// navigate({ screenName: Route.ContactUs });
			},
			svgName: Images.order,
			isPrimary: false,
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
		<Box 
			flex={1} 
			height="100%" 
			backgroundColor="white"
			style={{ 
				paddingTop: topPadding,
			}}
		>
			{/* Gradient Background Overlay - Subtle accent color */}
			<Box
				position="absolute"
				top={0}
				left={0}
				right={0}
				height="35%"
				style={{
					backgroundColor: '#FFF8F5',
					opacity: 0.5,
				}}
			/>
			
			<DrawerHeader onClose={onClosePress} />
			
			{/* Brand Logo Section */}
			<Box 
				alignItems="center" 
				justifyContent="center" 
				paddingVertical="lg"
				marginTop="m"
			>
				<Image 
					source={Images.logo} 
					height={120} 
					width={120} 
					resizeMode="contain"
				/>
			</Box>
			
			{/* Primary Menu Section */}
			<Box marginTop="m" paddingBottom="xl" style={{ zIndex: 1 }}>
				{primaryMenuItems.map((value, index) => {
					const MenuItem = ({ item, itemIndex }: { item: typeof value; itemIndex: number }) => {
						const translateX = useSharedValue(-50);
						const opacity = useSharedValue(0);
						const scale = useSharedValue(0.9);
						const pressScale = useSharedValue(1);
						const isActive = currentRoute === item.route;

						useEffect(() => {
							translateX.value = withDelay(itemIndex * 60, withSpring(0, {
								damping: 15,
								stiffness: 120,
							}));
							opacity.value = withDelay(itemIndex * 60, withTiming(1, { duration: 400 }));
							scale.value = withDelay(itemIndex * 60, withSpring(1, {
								damping: 15,
								stiffness: 120,
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
							<Animated.View style={[animatedStyle, { width: '100%' }]}>
								<Box 
									marginBottom="m"
									paddingLeft="xl"
									paddingRight="m"
									height={52}
									justifyContent="center"
									borderRadius={12}
									width="100%"
									style={{
										backgroundColor: isActive ? '#FFF8F5' : 'white',
										elevation: isActive ? 5 : 3,
										shadowColor: isActive ? '#842B25' : '#000',
										shadowOffset: { width: 0, height: isActive ? 3 : 2 },
										shadowOpacity: isActive ? 0.18 : 0.12,
										shadowRadius: isActive ? 6 : 4,
										borderWidth: 1,
										borderColor: isActive ? '#F5D5C8' : '#F0F0F0',
										overflow: 'hidden',
									}}
								>
									{/* Active indicator bar on the left */}
									{isActive && (
										<Box
											position="absolute"
											left={0}
											top={0}
											bottom={0}
											width={4}
											style={{
												backgroundColor: '#842B25',
												borderTopRightRadius: 4,
												borderBottomRightRadius: 4,
											}}
										/>
									)}
									{/* Active background accent */}
									{isActive && (
										<Box
											position="absolute"
											left={0}
											top={0}
											bottom={0}
											right={0}
											style={{
												backgroundColor: 'rgba(132, 43, 37, 0.03)',
											}}
										/>
									)}
									<Pressable
										onPress={item.onPress}
										onPressIn={handlePressIn}
										onPressOut={handlePressOut}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											width: '100%',
											height: '100%',
											position: 'relative',
											zIndex: 1,
										}}
									>
										{/* Active indicator dot */}
										{isActive && (
											<Box
												width={6}
												height={6}
												borderRadius={3}
												style={{
													backgroundColor: '#842B25',
													marginRight: 8,
												}}
											/>
										)}
										<Text 
											fontFamily={isActive ? fonts.bold : (item.isPrimary ? fonts.semiBold : fonts.medium)} 
											fontSize={item.isPrimary ? 16 : 15} 
											style={{ color: isActive ? '#842B25' : 'black' }} 
											letterSpacing={isActive ? 0.1 : -0.2}
										>
											{item.label}
										</Text>
									</Pressable>
								</Box>
							</Animated.View>
						);
					};

					return <MenuItem key={`primary-${index}`} item={value} itemIndex={index} />;
				})}
			</Box>

			{/* Categories Section */}
			<Box marginTop="m" paddingBottom="xl" style={{ zIndex: 1 }}>
				<Box paddingLeft="xl" paddingRight="m" marginBottom="m">
					<Text
						fontSize={14}
						fontFamily={fonts.semiBold}
						color="gray"
						textTransform="uppercase"
						letterSpacing={1}
					>
						Categories
					</Text>
				</Box>
				{categoriesLoading ? (
					<Box paddingLeft="xl" paddingRight="m" paddingVertical="m">
						<Text fontSize={14} fontFamily={fonts.regular} color="gray">
							Loading categories...
						</Text>
					</Box>
				) : categories.length > 0 ? (
					categories.map((category, index) => {
						const CategoryItem = ({ cat, catIndex }: { cat: Category; catIndex: number }) => {
							const translateX = useSharedValue(-50);
							const opacity = useSharedValue(0);
							const scale = useSharedValue(0.9);
							const pressScale = useSharedValue(1);
							const isActive = currentRoute === Route.ProductList;

							useEffect(() => {
								translateX.value = withDelay((primaryMenuItems.length + catIndex) * 60, withSpring(0, {
									damping: 15,
									stiffness: 120,
								}));
								opacity.value = withDelay((primaryMenuItems.length + catIndex) * 60, withTiming(1, { duration: 400 }));
								scale.value = withDelay((primaryMenuItems.length + catIndex) * 60, withSpring(1, {
									damping: 15,
									stiffness: 120,
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

							const handleCategoryPress = () => {
								onClosePress();
								navigate({
									screenName: Route.ProductList,
									params: {
										categoryId: cat.id,
										categoryName: cat.category_name,
									},
								});
							};

							return (
								<Animated.View style={[animatedStyle, { width: '100%' }]}>
									<Box 
										marginBottom="m"
										paddingLeft="xl"
										paddingRight="m"
										height={52}
										justifyContent="center"
										borderRadius={12}
										width="100%"
										style={{
											backgroundColor: 'white',
											elevation: 3,
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.12,
											shadowRadius: 4,
											borderWidth: 1,
											borderColor: '#F0F0F0',
											overflow: 'hidden',
										}}
									>
										<Pressable
											onPress={handleCategoryPress}
											onPressIn={handlePressIn}
											onPressOut={handlePressOut}
											style={{
												flexDirection: 'row',
												alignItems: 'center',
												width: '100%',
												height: '100%',
												position: 'relative',
												zIndex: 1,
											}}
										>
											<Text 
												fontFamily={fonts.medium} 
												fontSize={15} 
												color="black"
											>
												{cat.category_name}
											</Text>
											{cat.products_count !== undefined && (
												<Text 
													fontFamily={fonts.regular} 
													fontSize={12} 
													color="gray"
													marginLeft="s"
												>
													({cat.products_count})
												</Text>
											)}
										</Pressable>
									</Box>
								</Animated.View>
							);
						};

						return <CategoryItem key={`category-${category.id}`} cat={category} catIndex={index} />;
					})
				) : (
					<Box paddingLeft="xl" paddingRight="m" paddingVertical="m">
						<Text fontSize={14} fontFamily={fonts.regular} color="gray">
							No categories available
						</Text>
					</Box>
				)}
			</Box>

			{/* Logout Button at Bottom */}
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
						<Box
							position="absolute"
							bottom={0}
							left={0}
							right={0}
							style={{
								borderTopWidth: 1,
								borderTopColor: '#F0F0F0',
							}}
						>
							<Animated.View style={animatedStyle}>
								<Pressable
									onPress={() => {
										setIsLogoutVisible(true);
										onClosePress();
									}}
									onPressIn={handlePressIn}
									onPressOut={handlePressOut}
									style={{ width: '100%' }}
								>
									<Box
										flexDirection="row"
										justifyContent="center"
										alignItems="center"
										borderRadius={0}
										paddingHorizontal="m"
										backgroundColor="red3"
										style={{
											minHeight: 52,
											paddingTop: 16,
											paddingBottom: 16 + bottomPadding,
											elevation: 3,
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 2 },
											shadowOpacity: 0.2,
											shadowRadius: 4,
										}}
									>
										<Text
											color="white"
											fontSize={16}
											fontFamily={fonts.bold}
											letterSpacing={0.3}
										>
											🚪 Logout
										</Text>
									</Box>
								</Pressable>
							</Animated.View>
						</Box>
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
		</Box>
	);
});
