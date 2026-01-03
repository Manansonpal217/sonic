import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Screen, StatusBarType, Pressable } from '../components';
import { authStore } from '../stores/AuthStore';
import { Storage } from '../core/Storage';
import { reset, Route, goBack } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { Image } from '../components/Image';
import { LogoutPopup } from '../components/Drawer/LogoutPopup';
import { authFactory } from '../factory';

export const ProfileScreen: React.FC = observer(() => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44);
	const [isLogoutVisible, setIsLogoutVisible] = useState(false);

	const logoutApiCall = async () => {
		// const response = await authFactory.logoutApi();
		// if (response.isSuccess) {
		// }
	};

	const handleLogout = async () => {
		await authStore.clearLoginData();
		await Storage.remove('@auth_token');
		await logoutApiCall();
		reset({ screenName: Route.Login });
	};

	const user = authStore?.loginData?.user;


	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<Box
					backgroundColor="red3"
					paddingBottom="xl"
					paddingHorizontal="r"
					style={{ paddingTop: topPadding + 16 }}
				>
					<Box flexDirection="row" alignItems="center" marginBottom="lg">
						<Pressable onPress={goBack}>
							<Box
								width={40}
								height={40}
								borderRadius={20}
								justifyContent="center"
								alignItems="center"
								marginEnd="m"
								style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
							>
								<Text fontSize={20} color="white">←</Text>
							</Box>
						</Pressable>
						<Text
							fontSize={24}
							fontFamily={fonts.bold}
							color="white"
						>
							Profile
						</Text>
					</Box>

					{/* Avatar Section */}
					<Box alignItems="center" marginTop="lg">
						{user?.profilePic ? (
							<Box
								borderWidth={4}
								borderColor="white"
								borderRadius={60}
								padding={2}
							>
								<Image
									source={{ uri: user.profilePic }}
									height={120}
									width={120}
									borderRadius={60}
								/>
							</Box>
						) : (
							<Box
								width={120}
								height={120}
								borderRadius={60}
								backgroundColor="white"
								justifyContent="center"
								alignItems="center"
								borderWidth={4}
								borderColor="white"
							>
								<Text
									fontSize={48}
									fontFamily={fonts.bold}
									color="red3"
								>
									{user?.userName?.charAt(0)?.toUpperCase() || 'U'}
								</Text>
							</Box>
						)}
						<Text
							fontSize={24}
							fontFamily={fonts.bold}
							color="white"
							marginTop="m"
						>
							{user?.userName || 'User'}
						</Text>
						<Text
							fontSize={16}
							fontFamily={fonts.regular}
							marginTop="xs"
							style={{ color: 'rgba(255,255,255,0.9)' }}
						>
							{user?.userEmail || ''}
						</Text>
					</Box>
				</Box>

				{/* Profile Details */}
				<Box paddingHorizontal="r" marginTop="xl">
					{/* Personal Information Section */}
					<Box marginBottom="xl">
						<Text
							fontSize={18}
							fontFamily={fonts.bold}
							color="black"
							marginBottom="m"
						>
							Personal Information
						</Text>

						{/* Username */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Username
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.username || user?.userName || 'Not provided'}
							</Text>
						</Box>

						{/* Full Name */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Full Name
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.first_name && user?.last_name
									? `${user.first_name} ${user.last_name}`
									: user?.first_name || user?.last_name || user?.userName || 'Not provided'}
							</Text>
						</Box>

						{/* First Name */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								First Name
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.first_name || 'Not provided'}
							</Text>
						</Box>

						{/* Last Name */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Last Name
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.last_name || 'Not provided'}
							</Text>
						</Box>

						{/* Email */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Email Address
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.email || user?.userEmail || 'Not provided'}
							</Text>
						</Box>

						{/* Phone */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Phone Number
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.phone_number || user?.userPhone || 'Not provided'}
							</Text>
						</Box>

						{/* Address */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Address
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.address || user?.userAddress || 'Not provided'}
							</Text>
						</Box>
					</Box>

					{/* Business Information Section */}
					<Box marginBottom="xl">
						<Text
							fontSize={18}
							fontFamily={fonts.bold}
							color="black"
							marginBottom="m"
						>
							Business Information
						</Text>

						{/* Company Name */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Company Name
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.company_name || user?.userCompanyName || 'Not provided'}
							</Text>
						</Box>

						{/* GST Number */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								GST Number
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.gst || user?.userGst || 'Not provided'}
							</Text>
						</Box>
					</Box>

					{/* Account Section */}
					<Box marginBottom="xl">
						<Text
							fontSize={18}
							fontFamily={fonts.bold}
							color="black"
							marginBottom="m"
						>
							Account
						</Text>

						{/* User Status */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Account Status
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								style={{ 
									color: user?.user_status !== undefined 
										? (user.user_status ? '#4CAF50' : '#F44336')
										: '#9D9D9D'
								}}
							>
								{user?.user_status !== undefined 
									? (user.user_status ? 'Active' : 'Inactive')
									: 'Not provided'}
							</Text>
						</Box>

						{/* Is Active */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Active Status
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								style={{ 
									color: user?.is_active !== undefined 
										? (user.is_active ? '#4CAF50' : '#F44336')
										: '#9D9D9D'
								}}
							>
								{user?.is_active !== undefined 
									? (user.is_active ? 'Active' : 'Inactive')
									: 'Not provided'}
							</Text>
						</Box>

						{/* Member Since / Date Joined */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Member Since
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.date_joined || user?.createdAt || user?.created_at
									? new Date(user.date_joined || user.createdAt || user.created_at).toLocaleDateString()
									: 'Not provided'}
							</Text>
						</Box>

						{/* Last Login */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Last Login
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.last_login
									? new Date(user.last_login).toLocaleDateString()
									: 'Not provided'}
							</Text>
						</Box>

						{/* Updated At */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="s"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.medium}
								color="gray"
								marginBottom="xs"
							>
								Last Updated
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								{user?.updated_at || user?.updatedAt
									? new Date(user.updated_at || user.updatedAt).toLocaleDateString()
									: 'Not provided'}
							</Text>
						</Box>
					</Box>
				</Box>

				{/* Logout Button */}
				<Box paddingHorizontal="r" marginTop="lg" marginBottom="xl">
					<Pressable onPress={() => setIsLogoutVisible(true)}>
						<Box
							backgroundColor="red3"
							borderRadius={12}
							paddingVertical="m"
							alignItems="center"
							justifyContent="center"
						>
							<Text
								fontSize={16}
								fontFamily={fonts.bold}
								color="white"
							>
								Logout
							</Text>
						</Box>
					</Pressable>
				</Box>
			</ScrollView>

			<LogoutPopup
				onLogout={async () => {
					await handleLogout();
					setIsLogoutVisible(false);
				}}
				onClose={() => {
					setIsLogoutVisible(false);
				}}
				title="Logout"
				button1Label="Yes Logout"
				button2Label="Cancel"
				message="Are you sure you want to logout?"
				isLogout
				Visible={isLogoutVisible}
		/>
	</Screen>
	);
});
