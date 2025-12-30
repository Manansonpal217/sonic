import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Screen, StatusBarType, Pressable } from '../components';
import { authStore } from '../stores/AuthStore';
import { goBack, Route, reset } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { Image } from '../components/Image';
import { cartFactory } from '../factory/CartFactory';
import { CartItem } from '../api/CartApi';
import { showErrorMessage, showSuccessMessage } from '../core';
import { LogoutPopup } from '../components/Drawer/LogoutPopup';
import { Images } from '../assets';

export const CartScreen: React.FC = observer(() => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44);
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());

	const loadCartItems = async () => {
		try {
			setIsLoading(true);
			const response = await cartFactory.getCartListApi();
			if (response.isSuccess && response.data) {
				setCartItems(response.data.results || []);
			} else {
				// Don't show error if it's just an empty cart or user not found
				if (response.error && !response.error.includes('User ID not found')) {
					showErrorMessage(response.error || 'Failed to load cart items');
				}
				// Set empty array if no data
				setCartItems([]);
			}
		} catch (error: any) {
			console.error('Cart loading error:', error);
			showErrorMessage(error?.message || 'Failed to load cart items');
			setCartItems([]);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		let isMounted = true;
		let timeoutId: NodeJS.Timeout | null = null;
		
		// Timeout fallback to prevent infinite loading
		timeoutId = setTimeout(() => {
			if (isMounted) {
				console.warn('Cart loading timeout - stopping loading state');
				setIsLoading(false);
				setIsRefreshing(false);
				setCartItems([]);
				showErrorMessage('Request timed out. Please check your connection and try again.');
			}
		}, 35000); // 35 seconds (slightly longer than HTTP timeout)
		
		loadCartItems().then(() => {
			if (isMounted && timeoutId) {
				clearTimeout(timeoutId);
			}
		}).catch(() => {
			if (isMounted && timeoutId) {
				clearTimeout(timeoutId);
			}
		});
		
		return () => {
			isMounted = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		};
	}, []);

	const handleRefresh = () => {
		setIsRefreshing(true);
		loadCartItems();
	};

	const handleUpdateQuantity = async (cartId: number, newQuantity: number) => {
		if (newQuantity < 1) {
			handleDeleteItem(cartId);
			return;
		}

		// Optimistic update - update UI immediately
		setCartItems(prevItems => 
			prevItems.map(item => 
				item.id === cartId 
					? { ...item, cart_quantity: newQuantity }
					: item
			)
		);

		// Mark item as updating
		setUpdatingItems(prev => new Set(prev).add(cartId));

		try {
			const response = await cartFactory.updateCartItemApi(cartId, {
				cart_quantity: newQuantity,
			});

			if (response.isSuccess) {
				// Update with server response if different (for consistency)
				if (response.data) {
					setCartItems(prevItems => 
						prevItems.map(item => 
							item.id === cartId 
								? { ...item, cart_quantity: response.data!.cart_quantity }
								: item
						)
					);
				}
			} else {
				// Revert optimistic update on error
				loadCartItems();
				showErrorMessage(response.error || 'Failed to update cart item');
			}
		} catch (error: any) {
			// Revert optimistic update on error
			loadCartItems();
			showErrorMessage(error?.message || 'Failed to update cart item');
		} finally {
			// Remove from updating set
			setUpdatingItems(prev => {
				const newSet = new Set(prev);
				newSet.delete(cartId);
				return newSet;
			});
		}
	};

	const handleDeleteItem = async (cartId: number) => {
		// Optimistic update - remove from UI immediately
		const itemToDelete = cartItems.find(item => item.id === cartId);
		setCartItems(prevItems => prevItems.filter(item => item.id !== cartId));

		try {
			const response = await cartFactory.deleteCartItemApi(cartId);
			if (response.isSuccess) {
				// Item already removed optimistically, no need to reload
			} else {
				// Revert optimistic update on error
				if (itemToDelete) {
					setCartItems(prevItems => [...prevItems, itemToDelete].sort((a, b) => a.id - b.id));
				}
				showErrorMessage(response.error || 'Failed to remove item');
			}
		} catch (error: any) {
			// Revert optimistic update on error
			if (itemToDelete) {
				setCartItems(prevItems => [...prevItems, itemToDelete].sort((a, b) => a.id - b.id));
			}
			showErrorMessage(error?.message || 'Failed to remove item');
		}
	};

	const handleCheckout = async () => {
		try {
			// Navigate to checkout screen or process checkout
			// For now, show a message that checkout functionality will be implemented
			showSuccessMessage('Proceeding to checkout...');
			// TODO: Navigate to checkout screen or call checkout API
			// Example: navigation.navigate('Checkout');
		} catch (error: any) {
			showErrorMessage(error?.message || 'Failed to proceed to checkout');
		}
	};

	const calculateTotal = () => {
		// Since cart_product is a string, we might need to parse it
		// For now, we'll just show the quantity
		return cartItems.reduce((sum, item) => sum + item.cart_quantity, 0);
	};

	if (isLoading) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center">
					<ActivityIndicator size="large" color="#842B25" />
					<Text marginTop="m" color="gray">
						Loading cart...
					</Text>
				</Box>
			</Screen>
		);
	}

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<Box flex={1}>
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ paddingBottom: 180 }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor="#842B25"
						/>
					}
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
							Shopping Cart
						</Text>
					</Box>
				</Box>

				{/* Cart Items */}
				<Box paddingHorizontal="r" marginTop="xl">
					{cartItems.length === 0 ? (
						<Box
							alignItems="center"
							justifyContent="center"
							paddingVertical="xl"
							marginTop="xl"
						>
							<Text
								fontSize={18}
								fontFamily={fonts.semiBold}
								color="gray"
								marginBottom="s"
							>
								Your cart is empty
							</Text>
							<Text
								fontSize={14}
								fontFamily={fonts.regular}
								color="gray"
							>
								Add items to your cart to see them here
							</Text>
						</Box>
					) : (
						<>
							{cartItems.map((item) => (
								<Box
									key={`cart-item-${item.id}`}
									backgroundColor="gray5"
									borderRadius={12}
									padding="m"
									marginBottom="s"
								>
									<Box flexDirection="row" justifyContent="space-between" alignItems="center">
										{/* Product Image */}
										<Box
											width={80}
											height={80}
											borderRadius={8}
											backgroundColor="white"
											marginEnd="m"
											overflow="hidden"
											justifyContent="center"
											alignItems="center"
										>
											{item.product_image ? (
												<Image
													source={{ uri: item.product_image }}
													style={{ width: 80, height: 80 }}
													resizeMode="cover"
												/>
											) : (
												<Image
													source={Images.logo}
													style={{ width: 80, height: 80 }}
													resizeMode="contain"
												/>
											)}
										</Box>

										<Box flex={1} marginEnd="m">
											<Text
												fontSize={16}
												fontFamily={fonts.bold}
												color="black"
												marginBottom="xs"
											>
												Product #{item.id}
											</Text>
											<Text
												fontSize={14}
												fontFamily={fonts.regular}
												color="gray"
											>
												{item.cart_product}
											</Text>
										</Box>

										<Box alignItems="center" justifyContent="center">
											{/* Quantity Controls */}
											<Box
												flexDirection="row"
												alignItems="center"
												marginBottom="s"
											>
												<Pressable
													onPress={() =>
														handleUpdateQuantity(item.id, item.cart_quantity - 1)
													}
													disabled={updatingItems.has(item.id)}
												>
													<Box
														width={32}
														height={32}
														borderRadius={16}
														backgroundColor="white"
														justifyContent="center"
														alignItems="center"
														marginEnd="s"
														style={{ opacity: updatingItems.has(item.id) ? 0.5 : 1 }}
													>
														{updatingItems.has(item.id) ? (
															<ActivityIndicator size="small" color="#842B25" />
														) : (
															<Text fontSize={18} color="black">−</Text>
														)}
													</Box>
												</Pressable>

												<Text
													fontSize={16}
													fontFamily={fonts.semiBold}
													color="black"
													marginHorizontal="s"
												>
													{item.cart_quantity}
												</Text>

												<Pressable
													onPress={() =>
														handleUpdateQuantity(item.id, item.cart_quantity + 1)
													}
													disabled={updatingItems.has(item.id)}
												>
													<Box
														width={32}
														height={32}
														borderRadius={16}
														backgroundColor="white"
														justifyContent="center"
														alignItems="center"
														marginStart="s"
														style={{ opacity: updatingItems.has(item.id) ? 0.5 : 1 }}
													>
														{updatingItems.has(item.id) ? (
															<ActivityIndicator size="small" color="#842B25" />
														) : (
															<Text fontSize={18} color="black">+</Text>
														)}
													</Box>
												</Pressable>
											</Box>

											{/* Delete Icon */}
											<Pressable onPress={() => handleDeleteItem(item.id)}>
												<Box
													width={36}
													height={36}
													borderRadius={18}
													justifyContent="center"
													alignItems="center"
													style={{ backgroundColor: 'transparent' }}
												>
													<Text fontSize={20} color="red3">🗑️</Text>
												</Box>
											</Pressable>
										</Box>
									</Box>
								</Box>
							))}
						</>
					)}
				</Box>
			</ScrollView>

			{/* Summary Section and Checkout Button - Fixed at Bottom */}
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
					{/* Summary Section */}
					<Box
						backgroundColor="gray5"
						borderRadius={12}
						padding="m"
						marginHorizontal="r"
						marginTop="m"
						marginBottom="s"
					>
						<Box
							flexDirection="row"
							justifyContent="space-between"
							alignItems="center"
						>
							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
							>
								Total Items:
							</Text>
							<Text
								fontSize={16}
								fontFamily={fonts.bold}
								color="black"
							>
								{calculateTotal()}
							</Text>
						</Box>
					</Box>

					{/* Checkout Button */}
					<Box paddingHorizontal="r" paddingBottom="m">
						<Pressable onPress={handleCheckout}>
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
									Checkout
								</Text>
							</Box>
						</Pressable>
					</Box>
				</Box>
			)}
			</Box>
		</Screen>
	);
});

