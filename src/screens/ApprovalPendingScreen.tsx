import React from 'react';
import { View } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Screen, StatusBarType, Pressable } from '../components';
import { authStore } from '../stores/AuthStore';
import { reset, Route } from '../navigation/AppNavigation';
import { fonts } from '../style';

export const ApprovalPendingScreen: React.FC = observer(() => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44);

	const handleLogout = async () => {
		await authStore.clearLoginData();
		reset({ screenName: Route.Login });
	};

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<View style={{ flex: 1, paddingTop: topPadding + 24, paddingHorizontal: 24 }}>
				<Box flex={1} justifyContent="center" alignItems="center">
					<Box
						alignItems="center"
						paddingHorizontal="xl"
						paddingVertical="xl"
						style={{ maxWidth: 320 }}
					>
						<Box
							width={80}
							height={80}
							borderRadius={40}
							backgroundColor="red3"
							justifyContent="center"
							alignItems="center"
							marginBottom="xl"
						>
							<Text fontSize={36} color="white">⏳</Text>
						</Box>
						<Text
							fontSize={22}
							fontFamily={fonts.bold}
							color="dark"
							textAlign="center"
							marginBottom="m"
						>
							Approval Pending
						</Text>
						<Text
							fontSize={16}
							fontFamily={fonts.regular}
							color="gray"
							textAlign="center"
							lineHeight={24}
							marginBottom="xl"
						>
							Your account is pending admin approval. You will be able to access the app once an administrator approves your account.
						</Text>
						<Text
							fontSize={14}
							fontFamily={fonts.regular}
							color="gray"
							textAlign="center"
						>
							Please check back later or contact support.
						</Text>
					</Box>

					<Pressable
						onPress={handleLogout}
						style={{
							marginTop: 32,
							paddingVertical: 14,
							paddingHorizontal: 32,
							backgroundColor: '#842B25',
							borderRadius: 12,
							alignSelf: 'center',
						}}
					>
						<Text fontSize={16} fontFamily={fonts.semiBold} color="white">
							Logout
						</Text>
					</Pressable>
				</Box>
			</View>
		</Screen>
	);
});
