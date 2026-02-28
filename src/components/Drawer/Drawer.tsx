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
import { fonts, palette } from '../../style';
import { Pressable } from '../Pressable';
import { ScrollView } from 'react-native';
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
	const topPadding = insets.top + 8;
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

	// Menu items (sales staff see Scan QR Code)
	const user = authStore.loginData?.user;
	const primaryMenuItems = [
		{ label: 'Dashboard', route: Route.Dashboard, isPrimary: true },
		{ label: 'My Orders', route: Route.Orders, isPrimary: true },
		...(user?.is_staff ? [{ label: 'Scan QR Code', route: Route.ScanQR, isPrimary: true }] : []),
		{ label: 'About Us', route: 'AboutUs', isPrimary: false },
		{ label: 'Contact Us', route: 'ContactUs', isPrimary: false },
	].map((item) => ({
		...item,
		onPress: () => {
			onClosePress();
			if (item.route === Route.Dashboard) navigate({ screenName: Route.Dashboard });
			else if (item.route === Route.Orders) navigate({ screenName: Route.Orders });
			else if (item.route === Route.ScanQR) navigate({ screenName: Route.ScanQR });
		},
	}));

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
		const response = await authFactory.deleteAccountApi();
		if (response.isSuccess) {
			await handleLogout();
		}
	};

	return (
		<Box 
			flex={1} 
			height="100%" 
			backgroundColor="white"
			flexDirection="column"
		>
			{/* Premium gradient background - warm accent */}
			<Box
				position="absolute"
				top={0}
				left={0}
				right={0}
				height="50%"
				style={{
					backgroundColor: '#FDF8F6',
					opacity: 1,
				}}
			/>
			<Box
				position="absolute"
				top={0}
				left={0}
				right={0}
				height="25%"
				style={{
					backgroundColor: '#FFF5F2',
					opacity: 0.9,
				}}
			/>
			
			<DrawerHeader onClose={onClosePress} />
			
			<ScrollView
				style={{ flex: 1, zIndex: 1 }}
				contentContainerStyle={{ paddingBottom: 28, paddingHorizontal: 20 }}
				showsVerticalScrollIndicator={false}
			>
			{/* Primary Menu Section */}
			<Box marginTop="lg" marginBottom="xl">
				<Box marginBottom="m" paddingLeft="s">
					<Text
						fontSize={11}
						fontFamily={fonts.semiBold}
						style={{ color: palette.gray }}
						textTransform="uppercase"
						letterSpacing={1.5}
					>
						Navigation
					</Text>
				</Box>
				{primaryMenuItems.map((value, index) => {
					const MenuItem = ({ item, itemIndex }: { item: typeof value; itemIndex: number }) => {
						const translateX = useSharedValue(-30);
						const opacity = useSharedValue(0);
						const pressScale = useSharedValue(1);
						const isActive = currentRoute === item.route;

						useEffect(() => {
							translateX.value = withDelay(itemIndex * 50, withSpring(0, {
								damping: 18,
								stiffness: 100,
							}));
							opacity.value = withDelay(itemIndex * 50, withTiming(1, { duration: 300 }));
						}, []);

						const animatedStyle = useAnimatedStyle(() => ({
							transform: [
								{ translateX: translateX.value },
								{ scale: pressScale.value },
							],
							opacity: opacity.value,
						}));

						const handlePressIn = () => {
							pressScale.value = withSpring(0.98, {
								damping: 15,
								stiffness: 400,
							});
						};

						const handlePressOut = () => {
							pressScale.value = withSpring(1, {
								damping: 15,
								stiffness: 400,
							});
						};

						return (
							<Animated.View style={[animatedStyle, { width: '100%', marginBottom: 8 }]}>
								<Pressable
									onPress={item.onPress}
									onPressIn={handlePressIn}
									onPressOut={handlePressOut}
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										paddingVertical: 14,
										paddingHorizontal: 18,
										borderRadius: 14,
										backgroundColor: isActive ? '#FFF5F7' : 'rgba(255,255,255,0.9)',
										borderWidth: 1,
										borderColor: isActive ? 'rgba(223, 29, 63, 0.25)' : 'rgba(0,0,0,0.06)',
										overflow: 'hidden',
										shadowColor: isActive ? palette.primary : '#000',
										shadowOffset: { width: 0, height: 1 },
										shadowOpacity: isActive ? 0.08 : 0.04,
										shadowRadius: 6,
										elevation: isActive ? 3 : 2,
									}}
								>
									{/* Left accent bar - active only */}
									{isActive && (
										<Box
											position="absolute"
											left={0}
											top={0}
											bottom={0}
											width={4}
											style={{
												backgroundColor: palette.primary,
												borderTopRightRadius: 2,
												borderBottomRightRadius: 2,
											}}
										/>
									)}
									{/* Icon accent */}
									<Box
										width={36}
										height={36}
										borderRadius={10}
										alignItems="center"
										justifyContent="center"
										marginRight="m"
										style={{
											backgroundColor: isActive ? palette.primary : 'rgba(0,0,0,0.06)',
										}}
									>
										<Text
											fontSize={16}
											fontFamily={fonts.bold}
											style={{ color: isActive ? 'white' : palette.dark }}
										>
											{item.label.charAt(0)}
										</Text>
									</Box>
									<Text
										fontFamily={isActive ? fonts.bold : (item.isPrimary ? fonts.semiBold : fonts.medium)}
										fontSize={15}
										style={{ color: isActive ? palette.primary : palette.dark }}
										letterSpacing={-0.2}
									>
										{item.label}
									</Text>
								</Pressable>
							</Animated.View>
						);
					};

					return <MenuItem key={`primary-${index}`} item={value} itemIndex={index} />;
				})}
			</Box>

			{/* Categories Section */}
			<Box marginTop="xl" paddingBottom="xl">
				<Box marginBottom="m" paddingLeft="s">
					<Text
						fontSize={11}
						fontFamily={fonts.semiBold}
						style={{ color: palette.gray }}
						textTransform="uppercase"
						letterSpacing={1.5}
					>
						Shop by Category
					</Text>
				</Box>
				{categoriesLoading ? (
					<Box paddingVertical="m" paddingHorizontal="s">
						<Text fontSize={14} fontFamily={fonts.regular} style={{ color: palette.gray }}>
							Loading...
						</Text>
					</Box>
				) : categories.length > 0 ? (
					categories.map((category, index) => {
						const CategoryItem = ({ cat, catIndex }: { cat: Category; catIndex: number }) => {
							const translateX = useSharedValue(-30);
							const opacity = useSharedValue(0);
							const pressScale = useSharedValue(1);

							useEffect(() => {
								translateX.value = withDelay((primaryMenuItems.length + catIndex) * 50, withSpring(0, {
									damping: 18,
									stiffness: 100,
								}));
								opacity.value = withDelay((primaryMenuItems.length + catIndex) * 50, withTiming(1, { duration: 300 }));
							}, []);

							const animatedStyle = useAnimatedStyle(() => ({
								transform: [
									{ translateX: translateX.value },
									{ scale: pressScale.value },
								],
								opacity: opacity.value,
							}));

							const handlePressIn = () => {
								pressScale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
							};

							const handlePressOut = () => {
								pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
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
								<Animated.View style={[animatedStyle, { width: '100%', marginBottom: 8 }]}>
									<Pressable
										onPress={handleCategoryPress}
										onPressIn={handlePressIn}
										onPressOut={handlePressOut}
										style={{
											flexDirection: 'row',
											alignItems: 'center',
											justifyContent: 'space-between',
											paddingVertical: 12,
											paddingHorizontal: 18,
											borderRadius: 12,
											backgroundColor: 'rgba(255,255,255,0.9)',
											borderWidth: 1,
											borderColor: 'rgba(0,0,0,0.06)',
											shadowColor: '#000',
											shadowOffset: { width: 0, height: 1 },
											shadowOpacity: 0.04,
											shadowRadius: 6,
											elevation: 2,
										}}
									>
										<Text
											fontFamily={fonts.medium}
											fontSize={15}
											style={{ color: palette.dark }}
										>
											{cat.category_name}
										</Text>
										{cat.products_count !== undefined && (
											<Box
												paddingHorizontal="s"
												paddingVertical="xs"
												borderRadius={8}
												style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
											>
												<Text fontFamily={fonts.semiBold} fontSize={12} style={{ color: palette.gray }}>
													{cat.products_count}
												</Text>
											</Box>
										)}
									</Pressable>
								</Animated.View>
							);
						};

						return <CategoryItem key={`category-${category.id}`} cat={category} catIndex={index} />;
					})
				) : (
					<Box paddingVertical="m" paddingHorizontal="s">
						<Text fontSize={14} fontFamily={fonts.regular} style={{ color: palette.gray }}>
							No categories available
						</Text>
					</Box>
				)}
			</Box>
			</ScrollView>

			{/* Logout Button at Bottom - fixed below scroll area */}
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
							flexShrink={0}
							style={{
								borderTopWidth: 1,
								borderTopColor: 'rgba(0,0,0,0.06)',
								backgroundColor: 'rgba(255,255,255,0.95)',
								paddingHorizontal: 20,
								paddingTop: 12,
								paddingBottom: 12 + bottomPadding,
							}}
						>
							<Animated.View style={[animatedStyle, { borderRadius: 14, overflow: 'hidden' }]}>
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
										borderRadius={14}
										paddingVertical="m"
										backgroundColor="red3"
										style={{
											shadowColor: palette.primary,
											shadowOffset: { width: 0, height: 4 },
											shadowOpacity: 0.3,
											shadowRadius: 8,
											elevation: 6,
										}}
									>
										<Text
											color="white"
											fontSize={15}
											fontFamily={fonts.semiBold}
											letterSpacing={0.2}
										>
											Log out
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
				button1Label="Logout"
				button2Label="Cancel"
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
