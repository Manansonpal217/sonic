import React, { useState } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRoute } from '@react-navigation/native';
import { Box, Text, Screen, StatusBarType, Pressable } from '../components';
import { orderFactory } from '../factory/OrderFactory';
import { CartItem } from '../api/CartApi';
import { authStore } from '../stores/AuthStore';
import { goBack, navigate, Route } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { showErrorMessage, showSuccessMessage } from '../core';
import { Image } from '../components/Image';
import { Images } from '../assets';
import { BASE_URL } from '../api/EndPoint';
import { getHttp } from '../core/Http';

export const CheckoutScreen = observer(() => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44);
	const route = useRoute();
	
	// Get route params
	const { cartItems = [], isSingleItemCheckout = false } = (route.params as {
		cartItems?: CartItem[];
		isSingleItemCheckout?: boolean;
	}) || {};

	const [loading, setLoading] = useState(false);

		const handlePlaceOrder = async () => {
		try {
			setLoading(true);

			const user = authStore?.loginData?.user;
			if (!user) {
				showErrorMessage('Please login to continue');
				return;
			}

			// Get user ID - check multiple possible field names
			let userId = user?.id || user?.user_id || user?.pk || user?.userId;

			// If user ID is not found, try to fetch it using email or username
			if (!userId) {
				try {
					const http = getHttp();
					const userEmail = user?.email || user?.userEmail;
					const userName = user?.username || user?.userName;
					
					if (userEmail || userName) {
						const searchParam = userEmail ? `email=${userEmail}` : `username=${userName}`;
						// Use full URL like other endpoints
						const usersUrl = `${BASE_URL}/users/?${searchParam}`;
						const userResult = await http.get<any>(usersUrl);
						
						if (userResult && userResult.isSuccess && userResult.data) {
							const users = userResult.data.results || userResult.data || [];
							if (users.length > 0) {
								userId = users[0].id;
							}
						}
					}
				} catch (error: any) {
					// Silently handle errors
					if (error?.message && !error.message.includes('timeout')) {
						console.warn('Failed to fetch user ID:', error?.message);
					}
				}
			}

			if (!userId) {
				showErrorMessage('User ID not found. Please login again.');
				return;
			}

			// Call checkout API
			// If single item checkout, send only that cart item's ID
			const cartItemIds = isSingleItemCheckout && cartItems.length > 0
				? [cartItems[0].id]
				: undefined;
			
			const result = await orderFactory.checkoutApi({
				user_id: userId,
				order_notes: isSingleItemCheckout 
					? `Single item checkout for product: ${cartItems[0]?.cart_product || ''}`
					: '',
				cart_item_ids: cartItemIds,
			});

			if (result.isSuccess && result.data) {
				showSuccessMessage('Order placed successfully!');
				// Navigate to order confirmation
				navigate({
					screenName: Route.OrderConfirmation,
					params: { order: result.data },
				});
			} else {
				showErrorMessage(result.error || 'Failed to place order. Please try again.');
			}
		} catch (error: any) {
			console.error('Checkout error:', error);
			showErrorMessage(error?.message || 'An error occurred during checkout');
		} finally {
			setLoading(false);
		}
	};

	const calculateTotalItems = () => {
		return cartItems.reduce((sum, item) => sum + item.cart_quantity, 0);
	};

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<Box flex={1}>
				{/* Header */}
				<Box
					backgroundColor="red3"
					paddingBottom="m"
					paddingHorizontal="r"
					style={{ paddingTop: topPadding + 8 }}
				>
					<Box flexDirection="row" alignItems="center" marginBottom="s">
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
							Checkout
						</Text>
					</Box>
				</Box>

				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 180 }}
					showsVerticalScrollIndicator={false}
				>
					{/* Order Summary */}
					<Box paddingHorizontal="r" marginTop="xl">
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="m"
						>
							<Text
								fontSize={18}
								fontFamily={fonts.bold}
								color="black"
								marginBottom="m"
							>
								Order Summary
							</Text>

							{cartItems.length === 0 ? (
								<Box alignItems="center" paddingVertical="xl">
									<Text fontSize={14} fontFamily={fonts.regular} color="gray">
										No items to checkout
									</Text>
								</Box>
							) : (
								<>
									{cartItems.map((item, index) => (
										<Box
											key={`checkout-item-${item.id}`}
											flexDirection="row"
											marginBottom={index < cartItems.length - 1 ? 'm' : 0}
											paddingBottom={index < cartItems.length - 1 ? 'm' : 0}
											style={{
												borderBottomWidth: index < cartItems.length - 1 ? 1 : 0,
												borderBottomColor: '#E5E5E5',
											}}
										>
											{/* Product Image */}
											<Box
												width={60}
												height={60}
												borderRadius={8}
												backgroundColor="white"
												marginEnd="m"
												overflow="hidden"
												justifyContent="center"
												alignItems="center"
											>
												{item.cart_product_image || item.product_image ? (
													<Image
														source={{ 
															uri: item.cart_product_image || item.product_image || ''
														}}
														style={{ width: 60, height: 60 }}
														resizeMode="cover"
													/>
												) : (
													<Image
														source={Images.logo}
														style={{ width: 60, height: 60 }}
														resizeMode="contain"
													/>
												)}
											</Box>

											<Box flex={1}>
												<Text
													fontSize={14}
													fontFamily={fonts.semiBold}
													color="black"
													marginBottom="xs"
												>
													{item.cart_product_name || 'Product'}
												</Text>
												<Text
													fontSize={12}
													fontFamily={fonts.regular}
													color="gray"
												>
													Quantity: {item.cart_quantity}
												</Text>
											</Box>
										</Box>
									))}

									{/* Total */}
									<Box
										marginTop="m"
										paddingTop="m"
										style={{
											borderTopWidth: 2,
											borderTopColor: '#842B25',
										}}
										flexDirection="row"
										justifyContent="space-between"
										alignItems="center"
									>
										<Text
											fontSize={16}
											fontFamily={fonts.bold}
											color="black"
										>
											Total Items:
										</Text>
										<Text
											fontSize={18}
											fontFamily={fonts.bold}
											color="red3"
										>
											{calculateTotalItems()}
										</Text>
									</Box>
								</>
							)}
						</Box>

						{/* Delivery Information */}
						<Box
							backgroundColor="gray5"
							borderRadius={12}
							padding="m"
							marginBottom="m"
						>
							<Text
								fontSize={18}
								fontFamily={fonts.bold}
								color="black"
								marginBottom="s"
							>
								Delivery Information
							</Text>
							<Text
								fontSize={14}
								fontFamily={fonts.regular}
								color="gray"
							>
								Your order will be processed and you will be contacted for delivery details.
							</Text>
						</Box>
					</Box>
				</ScrollView>

				{/* Place Order Button - Fixed at Bottom */}
				{cartItems.length > 0 && (
					<Box
						position="absolute"
						bottom={0}
						left={0}
						right={0}
						backgroundColor="white"
						style={{
							borderTopWidth: 1,
							borderTopColor: '#E5E5E5',
							shadowColor: '#000',
							shadowOffset: { width: 0, height: -2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 5,
						}}
					>
						<Box paddingHorizontal="r" paddingVertical="m">
							<Pressable onPress={handlePlaceOrder} disabled={loading}>
								<Box
									backgroundColor={loading ? 'gray' : 'red3'}
									borderRadius={12}
									paddingVertical="m"
									alignItems="center"
									justifyContent="center"
									style={{ opacity: loading ? 0.6 : 1 }}
								>
									{loading ? (
										<ActivityIndicator size="small" color="white" />
									) : (
										<Text
											fontSize={16}
											fontFamily={fonts.bold}
											color="white"
										>
											Place Order
										</Text>
									)}
								</Box>
							</Pressable>
						</Box>
					</Box>
				)}
			</Box>
		</Screen>
	);
});
