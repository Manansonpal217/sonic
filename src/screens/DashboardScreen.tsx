import React, { useState, useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Box, Text, Screen, StatusBarType, DrawerMenu, DashboardHeader, DashboardBanner, BannerItem } from '../components';
import { DeviceHelper } from '../helper/DeviceHelper';
import { navigate, Route } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { Images } from '../assets';

export const DashboardScreen: React.FC = () => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [searchText, setSearchText] = useState('');
	const refreshNotificationCountRef = useRef<(() => void) | null>(null);
	const refreshCartCountRef = useRef<(() => void) | null>(null);

	// Banner data using images from sonic app
	const bannerData: BannerItem[] = [
		{
			imageUrl: Images.loginImage,
			bannerProductId: '1',
		},
		{
			imageUrl: Images.loginImg,
			bannerProductId: '2',
		},
		{
			imageUrl: Images.logo,
			bannerProductId: '3',
		},
	];

	const handleBannerPress = (item: BannerItem, index: number) => {
		// Handle banner press - navigate to product detail or perform action
		console.log('Banner pressed:', item, index);
		if (item.bannerProductId) {
			// Navigate to product detail if needed
			// navigate({ screenName: Route.ProductDetail, params: { productId: item.bannerProductId } });
		}
	};

	const handleMenuPress = () => {
		setIsDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setIsDrawerOpen(false);
	};

	const handleNotificationPress = () => {
		navigate({ screenName: Route.Notification });
	};

	const handleAddToCartPress = () => {
		// Navigation is handled internally by DashboardHeader
		console.log('Navigate to cart');
	};

	const handleProfilePress = () => {
		navigate({ screenName: Route.Profile });
	};

	const handleSearch = (text: string) => {
		setSearchText(text);
	};

	// Refresh notification and cart count when screen comes into focus
	useFocusEffect(
		useCallback(() => {
			// Small delay to ensure component is mounted
			const timer = setTimeout(() => {
				if (refreshNotificationCountRef.current) {
					refreshNotificationCountRef.current();
				}
				if (refreshCartCountRef.current) {
					refreshCartCountRef.current();
				}
			}, 100);
			return () => clearTimeout(timer);
		}, [])
	);

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<DrawerMenu
				isOpen={isDrawerOpen}
				onClose={handleDrawerClose}
				onClosePress={handleDrawerClose}
				onGestureStart={() => {}}
			>
				<Box flex={1} backgroundColor="white">
					<DashboardHeader
						onMenuPress={handleMenuPress}
						onNotificationPress={handleNotificationPress}
						onAddToCartPress={handleAddToCartPress}
						onProfilePress={handleProfilePress}
						label="Dashboard"
						search={searchText}
						onSearch={handleSearch}
						refreshNotificationCount={refreshNotificationCountRef}
						refreshCartCount={refreshCartCountRef}
					/>
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingBottom: 20 }}
						showsVerticalScrollIndicator={false}
					>
						{/* Image Carousel Banner - Full Width */}
						<DashboardBanner 
							data={bannerData}
							onBannerPress={handleBannerPress}
						/>
						
						<Box flex={1} paddingHorizontal="r" paddingTop="m">
							
							{/* Dashboard content goes here */}
							<Box
								backgroundColor="gray5"
								borderRadius={12}
								padding="m"
								marginTop="m"
								marginBottom="m"
							>
								<Text
									fontSize={24}
									fontFamily={fonts.bold}
									color="black"
									marginBottom="s"
								>
									Welcome to Dashbaord
								</Text>
								<Text
									fontSize={16}
									fontFamily={fonts.regular}
									color="gray"
								>
									This is your main screen. You can add your dashboard content here.
								</Text>
							</Box>
						</Box>
					</ScrollView>
				</Box>
			</DrawerMenu>
		</Screen>
	);
};

