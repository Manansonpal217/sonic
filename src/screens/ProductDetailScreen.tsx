import React, { useEffect, useState } from 'react';
import { ScrollView, ActivityIndicator, View, Dimensions } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Screen, StatusBarType, Pressable, Image, Toast, Logo } from '../components';
import { goBack, Route, navigate } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { getHttp } from '../core';
import { Images } from '../assets';
import { cartFactory } from '../factory/CartFactory';
import { authStore } from '../stores/AuthStore';
import { BASE_URL } from '../api/EndPoint';

const { width } = Dimensions.get('window');

interface ProductFieldValue {
	id: number;
	field_name: string;
	field_label: string;
	field_type: string;
	field_value: string;
}

interface ProductVariantItem {
	id: number;
	variant_value_1: string;
	variant_value_2?: string | null;
	display_values?: Record<string, string>;
}

interface Product {
	id: number;
	product_name: string;
	product_description?: string;
	product_image?: string;
	product_category_name?: string;
	field_values?: ProductFieldValue[];
	variants?: ProductVariantItem[];
	variant_dimension_labels?: string[];
	dimension_1_options?: string[];
	dimension_2_options?: string[];
}

interface ProductDetailScreenProps {
	route?: {
		params?: {
			productId?: number;
		};
	};
}

export const ProductDetailScreen: React.FC<ProductDetailScreenProps> = observer(({ route }) => {
	const insets = useSafeAreaInsets();
	const topPadding = insets.top + 8;
	const bottomPadding = Math.max(insets.bottom, 0);
	const productId = route?.params?.productId;
	
	const [product, setProduct] = useState<Product | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);
	const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
	const [selectedDim1Value, setSelectedDim1Value] = useState<string | null>(null);
	const [selectedDim2Value, setSelectedDim2Value] = useState<string | null>(null);
	const [isAddingToCart, setIsAddingToCart] = useState(false);
	const [isInCart, setIsInCart] = useState(false);
	
	// Toast state
	const [toastMessage, setToastMessage] = useState<string>('');
	const [toastType, setToastType] = useState<'success' | 'error'>('success');
	const [showToast, setShowToast] = useState(false);

	const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
		setToastMessage(message);
		setToastType(type);
		setShowToast(true);
	};

	const loadProduct = async () => {
		if (!productId) {
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			const http = getHttp();
			const productUrl = `${BASE_URL}/products/${productId}/`;
			const result = await http.get<any>(productUrl);
			
			if (result.isSuccess && result.data) {
				const p = result.data;
				setProduct(p);
				if (p.variants?.length) {
					const first = p.variants[0];
					setSelectedDim1Value(first?.variant_value_1 ?? null);
					setSelectedDim2Value(first?.variant_value_2 ?? null);
					setSelectedVariantId(first?.id ?? null);
				} else {
					setSelectedDim1Value(null);
					setSelectedDim2Value(null);
					setSelectedVariantId(null);
				}
			} else {
				showToastMessage('Failed to load product details', 'error');
			}
		} catch (error: any) {
			showToastMessage('Failed to load product details', 'error');
		} finally {
			setIsLoading(false);
		}
	};

	// Check if product (and selected variant if any) is in cart
	const checkCartStatus = async () => {
		if (!authStore.isLogin() || !productId) {
			setIsInCart(false);
			return;
		}
		try {
			const response = await cartFactory.getCartListApi();
			if (response.isSuccess && response.data) {
				const cartItems = response.data.results || [];
				const inCart = cartItems.some((item: any) => {
					const itemProductId = typeof item.cart_product === 'object'
						? item.cart_product?.id
						: parseInt(item.cart_product, 10);
					if (itemProductId !== productId) return false;
					const itemVariantId = item.cart_variant != null
						? (typeof item.cart_variant === 'object' ? item.cart_variant?.id : item.cart_variant)
						: null;
					const matchVariant = product?.variants?.length
						? (itemVariantId != null && selectedVariantId != null && itemVariantId === selectedVariantId)
						: (itemVariantId == null || itemVariantId === null);
					return matchVariant;
				});
				setIsInCart(inCart);
			}
		} catch {
			setIsInCart(false);
		}
	};

	useEffect(() => {
		loadProduct();
	}, [productId]);

	useEffect(() => {
		checkCartStatus();
	}, [productId, product?.variants?.length, selectedVariantId]);

	// Resolve selected variant from dimension selections (Size + Karat)
	useEffect(() => {
		if (!product?.variants?.length) return;
		if (product.variants.length === 1 && !selectedDim1Value) return;
		const hasTwoDims = product.variants.some((v: ProductVariantItem) => v.variant_value_2 != null && v.variant_value_2 !== '');
		if (hasTwoDims) {
			if (selectedDim1Value != null && selectedDim2Value != null) {
				const match = product.variants.find(
					(v: ProductVariantItem) =>
						v.variant_value_1 === selectedDim1Value &&
						(v.variant_value_2 === selectedDim2Value || (v.variant_value_2 == null && selectedDim2Value === ''))
				);
				setSelectedVariantId(match?.id ?? null);
			} else {
				setSelectedVariantId(null);
			}
		} else {
			if (selectedDim1Value != null) {
				const match = product.variants.find((v: ProductVariantItem) => v.variant_value_1 === selectedDim1Value);
				setSelectedVariantId(match?.id ?? null);
			} else {
				setSelectedVariantId(null);
			}
		}
	}, [product?.variants, selectedDim1Value, selectedDim2Value]);

	const handleQuantityChange = (change: number) => {
		setQuantity(prev => Math.max(1, prev + change));
	};

	const handleAddToCart = async () => {
		if (!product || !authStore.isLogin()) {
			showToastMessage('Please login to add items to cart', 'error');
			return;
		}
		if (product.variants?.length && selectedVariantId == null) {
			showToastMessage('Please select a variant (e.g. size)', 'error');
			return;
		}

		setIsAddingToCart(true);

		try {
			const user = authStore.loginData?.user;
			if (!user) {
				showToastMessage('User not logged in', 'error');
				return;
			}

			// Get user ID
			let userId = user?.id || user?.user_id || user?.pk || user?.userId;
			
			if (!userId) {
				try {
					const http = getHttp();
					const userEmail = user?.email || user?.userEmail;
					const userName = user?.username || user?.userName;
					
					if (userEmail || userName) {
						const searchParam = userEmail ? `email=${userEmail}` : `username=${userName}`;
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
				}
			}
			
			if (!userId) {
				showToastMessage('Unable to identify user. Please try logging in again.', 'error');
				return;
			}

			// Check if product already exists in cart
			const cartResponse = await cartFactory.getCartListApi();
			let existingCartItem = null;
			
			if (cartResponse.isSuccess && cartResponse.data) {
				const cartItems = cartResponse.data.results || [];
				const itemVariantId = (item: any) => item.cart_variant != null
					? (typeof item.cart_variant === 'object' ? item.cart_variant?.id : item.cart_variant)
					: null;
				existingCartItem = cartItems.find((item: any) => {
					const itemProductId = typeof item.cart_product === 'object'
						? item.cart_product?.id
						: parseInt(item.cart_product, 10);
					if (itemProductId !== product.id) return false;
					if (product.variants?.length) {
						return itemVariantId(item) === selectedVariantId;
					}
					return itemVariantId(item) == null;
				});
			}

			let result;
			if (existingCartItem) {
				// Update existing cart item quantity
				const newQuantity = (existingCartItem.cart_quantity || 0) + quantity;
				result = await cartFactory.updateCartItemApi(existingCartItem.id, {
					cart_quantity: newQuantity,
				});
			} else {
				result = await cartFactory.addToCartApi({
					cart_user: userId,
					cart_product: product.id.toString(),
					cart_variant: product.variants?.length ? selectedVariantId ?? undefined : undefined,
					cart_quantity: quantity,
					cart_status: true,
				});
			}

			if (result.isSuccess) {
				showToastMessage('Added to cart', 'success');
				setIsInCart(true);
				setQuantity(1); // Reset quantity
			} else {
				// Handle unique constraint error
				if (result.error && result.error.includes('unique')) {
					const retryCartResponse = await cartFactory.getCartListApi();
					if (retryCartResponse.isSuccess && retryCartResponse.data) {
						const cartItems = retryCartResponse.data.results || [];
						const itemVariantId = (item: any) => item.cart_variant != null
						? (typeof item.cart_variant === 'object' ? item.cart_variant?.id : item.cart_variant)
						: null;
					const retryExistingItem = cartItems.find((item: any) => {
							const itemProductId = typeof item.cart_product === 'object'
								? item.cart_product?.id
								: parseInt(item.cart_product, 10);
							if (itemProductId !== product.id) return false;
							if (product.variants?.length) return itemVariantId(item) === selectedVariantId;
							return itemVariantId(item) == null;
						});
						
						if (retryExistingItem) {
							const newQuantity = (retryExistingItem.cart_quantity || 0) + quantity;
							const updateResult = await cartFactory.updateCartItemApi(retryExistingItem.id, {
								cart_quantity: newQuantity,
							});
							
							if (updateResult.isSuccess) {
								showToastMessage('Added to cart', 'success');
								setIsInCart(true);
								setQuantity(1);
								return;
							}
						}
					}
				}
				showToastMessage(result.error || 'Failed to add to cart', 'error');
			}
		} catch (error: any) {
			showToastMessage('Failed to add item to cart', 'error');
		} finally {
			setIsAddingToCart(false);
		}
	};

	if (isLoading) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center">
					<ActivityIndicator size="large" color="#842B25" />
					<Text marginTop="m" color="gray">
						Loading product...
					</Text>
				</Box>
			</Screen>
		);
	}

	if (!product) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center" padding="m">
					<Text fontSize={18} fontFamily={fonts.semiBold} color="gray" marginBottom="s">
						Product not found
					</Text>
					<Pressable onPress={goBack}>
						<Box
							backgroundColor="red3"
							borderRadius={8}
							paddingVertical="s"
							paddingHorizontal="m"
						>
							<Text fontSize={16} fontFamily={fonts.semiBold} color="white">
								Go Back
							</Text>
						</Box>
					</Pressable>
				</Box>
			</Screen>
		);
	}

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
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
							<Text fontSize={26} color="white" style={{ lineHeight: 30, textAlign: 'center', includeFontPadding: false }}>←</Text>
						</Box>
					</Pressable>
					<Text
						fontSize={20}
						fontFamily={fonts.bold}
						color="white"
						flex={1}
						numberOfLines={1}
					>
						{product.product_name}
					</Text>
				</Box>
			</Box>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ paddingBottom: 120 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Product Image */}
				<Box
					width="100%"
					height={width * 0.9}
					backgroundColor="gray5"
					justifyContent="center"
					alignItems="center"
					overflow="hidden"
				>
					{product.product_image ? (
						<Image
							source={{ uri: product.product_image }}
							style={{ width: '100%', height: '100%' }}
							resizeMode="cover"
						/>
					) : (
						<Logo
							width={120}
							height={108}
							style={{ opacity: 0.3 }}
						/>
					)}
				</Box>

				{/* Product Information */}
				<Box padding="m">
					{/* Product Name */}
					<Text
						fontSize={24}
						fontFamily={fonts.bold}
						color="black"
						marginBottom="s"
					>
						{product.product_name}
					</Text>

					{/* Category */}
					{product.product_category_name && (
						<Box
							alignSelf="flex-start"
							backgroundColor="gray5"
							borderRadius={6}
							paddingVertical="xs"
							paddingHorizontal="s"
							marginBottom="m"
						>
							<Text
								fontSize={12}
								fontFamily={fonts.regular}
								color="gray"
							>
								{product.product_category_name}
							</Text>
						</Box>
					)}

					{/* Description */}
					{product.product_description && (
						<Box marginBottom="m">
							<Text
								fontSize={16}
								fontFamily={fonts.regular}
								color="black"
								lineHeight={24}
							>
								{product.product_description}
							</Text>
						</Box>
					)}

					{/* Divider */}
					<Box
						height={1}
						backgroundColor="gray5"
						marginVertical="m"
					/>

					{/* Two selectors: Size and Karat (or dimension 1 & 2) */}
					{product.variants && product.variants.length > 0 && (() => {
						const dim1Options = product.dimension_1_options
							?? [...new Set(product.variants.map((v: ProductVariantItem) => v.variant_value_1))];
						const dim2Options = product.dimension_2_options
							?? [...new Set(product.variants.map((v: ProductVariantItem) => v.variant_value_2).filter(Boolean))];
						const label1 = product.variant_dimension_labels?.[0] ?? 'Size';
						const label2 = product.variant_dimension_labels?.[1] ?? 'Karat';
						return (
							<Box marginBottom="m">
								<Box marginBottom="m">
									<Text fontSize={16} fontFamily={fonts.semiBold} color="black" marginBottom="s">
										{label1}
									</Text>
									<Box flexDirection="row" flexWrap="wrap">
										{dim1Options.map((opt: string) => {
											const isSelected = selectedDim1Value === opt;
											return (
												<Pressable
													key={opt}
													onPress={() => setSelectedDim1Value(opt)}
													style={{
														marginRight: 8,
														marginBottom: 8,
														paddingVertical: 10,
														paddingHorizontal: 14,
														borderRadius: 8,
														borderWidth: 1,
														borderColor: isSelected ? '#842B25' : '#E0E0E0',
														backgroundColor: isSelected ? 'rgba(132,43,37,0.08)' : 'white',
													}}
												>
													<Text fontSize={14} fontFamily={isSelected ? fonts.semiBold : fonts.regular} color={isSelected ? '#842B25' : 'black'}>
														{opt}
													</Text>
												</Pressable>
											);
										})}
									</Box>
								</Box>
								{dim2Options.length > 0 && (
									<Box marginBottom="m">
										<Text fontSize={16} fontFamily={fonts.semiBold} color="black" marginBottom="s">
											{label2}
										</Text>
										<Box flexDirection="row" flexWrap="wrap">
											{dim2Options.map((opt: string) => {
												const isSelected = selectedDim2Value === opt;
												return (
													<Pressable
														key={opt}
														onPress={() => setSelectedDim2Value(opt)}
														style={{
															marginRight: 8,
															marginBottom: 8,
															paddingVertical: 10,
															paddingHorizontal: 14,
															borderRadius: 8,
															borderWidth: 1,
															borderColor: isSelected ? '#842B25' : '#E0E0E0',
															backgroundColor: isSelected ? 'rgba(132,43,37,0.08)' : 'white',
														}}
													>
														<Text fontSize={14} fontFamily={isSelected ? fonts.semiBold : fonts.regular} color={isSelected ? '#842B25' : 'black'}>
															{opt}
														</Text>
													</Pressable>
												);
											})}
										</Box>
									</Box>
								)}
								{selectedVariantId && (() => {
									const sel = product.variants?.find((v: ProductVariantItem) => v.id === selectedVariantId);
									if (!sel?.display_values) return null;
									return (
										<Box flexDirection="row" flexWrap="wrap">
											{Object.entries(sel.display_values).map(([k, val]: [string, string]) => (
												<Text key={k} fontSize={14} fontFamily={fonts.regular} color="gray" marginRight="m">
													{k}: {val}
												</Text>
											))}
										</Box>
									);
								})()}
							</Box>
						);
					})()}

					{/* Product Fields Section */}
					{product.field_values && product.field_values.length > 0 && (
						<Box marginBottom="m">
							<Text
								fontSize={18}
								fontFamily={fonts.bold}
								color="black"
								marginBottom="m"
							>
								Product Details
							</Text>

							{product.field_values.map((field, index) => (
								<Box
									key={field.id || index}
									backgroundColor="white"
									borderRadius={12}
									padding="m"
									marginBottom="s"
									style={{
										borderWidth: 1,
										borderColor: '#F0F0F0',
										shadowColor: '#000',
										shadowOffset: { width: 0, height: 1 },
										shadowOpacity: 0.05,
										shadowRadius: 2,
										elevation: 1,
									}}
								>
									<Box flexDirection="row" justifyContent="space-between" alignItems="center">
										<Box flex={1}>
											<Text
												fontSize={13}
												fontFamily={fonts.regular}
												color="gray"
												marginBottom="xs"
											>
												{field.field_label || field.field_name}
											</Text>
											<Text
												fontSize={16}
												fontFamily={fonts.semiBold}
												color="black"
											>
												{field.field_value || 'N/A'}
											</Text>
										</Box>
									</Box>
								</Box>
							))}
						</Box>
					)}
				</Box>
			</ScrollView>

			{/* Sticky Bottom Bar - Quantity and Add to Cart */}
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
					elevation: 8,
					paddingBottom: bottomPadding,
				}}
			>
				<Box
					flexDirection="row"
					alignItems="center"
					paddingHorizontal="m"
					paddingVertical="m"
					justifyContent="space-between"
				>
					{/* Quantity Selector */}
					<Box
						flexDirection="row"
						alignItems="center"
						backgroundColor="gray5"
						borderRadius={12}
						paddingVertical="s"
						paddingHorizontal="m"
					>
						<Pressable
							onPress={() => handleQuantityChange(-1)}
							disabled={quantity <= 1}
							style={{
								width: 36,
								height: 36,
								borderRadius: 18,
								backgroundColor: quantity <= 1 ? '#E0E0E0' : '#842B25',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
						<Text
							fontSize={20}
							fontFamily={fonts.bold}
							style={{ color: quantity <= 1 ? '#999' : 'white' }}
						>
							−
						</Text>
						</Pressable>

						<Text
							fontSize={18}
							fontFamily={fonts.bold}
							color="black"
							marginHorizontal="m"
							minWidth={40}
							textAlign="center"
						>
							{quantity}
						</Text>

						<Pressable
							onPress={() => handleQuantityChange(1)}
							style={{
								width: 36,
								height: 36,
								borderRadius: 18,
								backgroundColor: '#842B25',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<Text
								fontSize={20}
								fontFamily={fonts.bold}
								color="white"
							>
								+
							</Text>
						</Pressable>
					</Box>

					{/* Add to Cart Button */}
					<Pressable
						onPress={handleAddToCart}
						disabled={isAddingToCart || isInCart}
						style={{
							flex: 1,
							marginLeft: 12,
							backgroundColor: isInCart ? '#4CAF50' : (isAddingToCart ? '#CCCCCC' : '#842B25'),
							borderRadius: 12,
							paddingVertical: 14,
							alignItems: 'center',
							justifyContent: 'center',
							shadowColor: isInCart ? '#4CAF50' : '#842B25',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.3,
							shadowRadius: 4,
							elevation: 4,
						}}
					>
						{isAddingToCart ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<Text
								fontSize={16}
								fontFamily={fonts.bold}
								color="white"
								letterSpacing={0.5}
							>
								{isInCart ? 'Added to Cart' : 'Add to Cart'}
							</Text>
						)}
					</Pressable>
				</Box>
			</Box>

			{/* Toast Message */}
			<Toast
				message={toastMessage}
				type={toastType}
				visible={showToast}
				onHide={() => setShowToast(false)}
			/>
		</Screen>
	);
});

