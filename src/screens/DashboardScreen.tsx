import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Box, Text, Screen, StatusBarType, DrawerMenu, DashboardHeader } from '../components';
import { DeviceHelper } from '../helper/DeviceHelper';
import { navigate, Route } from '../navigation/AppNavigation';
import { fonts } from '../style';

export const DashboardScreen: React.FC = () => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [searchText, setSearchText] = useState('');

	const handleMenuPress = () => {
		setIsDrawerOpen(true);
	};

	const handleDrawerClose = () => {
		setIsDrawerOpen(false);
	};

	const handleNotificationPress = () => {
		// Navigate to notifications
		console.log('Navigate to notifications');
	};

	const handleAddToCartPress = () => {
		// Navigate to cart
		console.log('Navigate to cart');
	};

	const handleSearch = (text: string) => {
		setSearchText(text);
	};

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
						label="Dashboard"
						search={searchText}
						onSearch={handleSearch}
					/>
					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingBottom: 20 }}
						showsVerticalScrollIndicator={false}
					>
						<Box flex={1} paddingHorizontal="r" paddingTop="m">
							{/* Dashboard content goes here */}
							<Box
								backgroundColor="gray5"
								borderRadius={12}
								padding="m"
								marginBottom="m"
							>
								<Text
									fontSize={24}
									fontFamily={fonts.bold}
									color="black"
									marginBottom="s"
								>
									Welcome to Dashboard
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

