import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, View, Modal } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box, Text, Screen, StatusBarType, Pressable, Image, Toast } from '../components';
import { goBack, navigate, Route } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { getHttp } from '../core';
import { Images } from '../assets';
import { cartFactory } from '../factory/CartFactory';
import { authStore } from '../stores/AuthStore';
import { BASE_URL } from '../api/EndPoint';

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 2 columns with padding

interface Product {
	id: number;
	product_name: string;
	product_description?: string;
	product_image?: string;
	product_price?: number;
	category?: number;
}

interface ProductListScreenProps {
	route?: {
		params?: {
			categoryId?: number;
			categoryName?: string;
		};
	};
}

export const ProductListScreen: React.FC<ProductListScreenProps> = observer(({ route }) => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44);
	const categoryId = route?.params?.categoryId;
	const categoryName = route?.params?.categoryName || 'Products';
	
	const [products, setProducts] = useState<Product[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
	const [addingToCart, setAddingToCart] = useState<{ [key: number]: boolean }>({});
	const [cartProductIds, setCartProductIds] = useState<Set<number>>(new Set()); // Track products in cart
	
	// Sort and Filter states
	const [sortBy, setSortBy] = useState<string>('-created_at'); // Default: newest first
	const [priceFilter, setPriceFilter] = useState<string>('all'); // all, low, medium, high
	const [showSortModal, setShowSortModal] = useState(false);
	const [showFilterModal, setShowFilterModal] = useState(false);
	
	// Toast state
	const [toastMessage, setToastMessage] = useState<string>('');
	const [toastType, setToastType] = useState<'success' | 'error'>('success');
	const [showToast, setShowToast] = useState(false);

	const loadProducts = async () => {
		try {
			setIsLoading(true);
			const http = getHttp();
			
			// Build query parameters
			const params = new URLSearchParams();
			
			// Add category filter if categoryId is provided
			if (categoryId) {
				params.append('category', categoryId.toString());
			}
			
			// Add sort parameter
			if (sortBy) {
				params.append('ordering', sortBy);
			}
			
			// Add price filter
			if (priceFilter !== 'all') {
				switch (priceFilter) {
					case 'low':
						params.append('max_price', '500');
						break;
					case 'medium':
						params.append('min_price', '500');
						params.append('max_price', '2000');
						break;
					case 'high':
						params.append('min_price', '2000');
						break;
				}
			}
			
			// Build URL
			let url = `${BASE_URL}/products/`;
			if (params.toString()) {
				url += `?${params.toString()}`;
			}
			
			const result = await http.get<any>(url);
			
			if (result.isSuccess && result.data) {
				const productList = result.data.results || result.data || [];
				setProducts(productList);
			} else {
				setProducts([]);
			}
		} catch (error: any) {
			console.error('Error loading products:', error);
			setProducts([]);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	// Load cart items to track which products are in cart
	const loadCartItems = useCallback(async () => {
		if (!authStore.isLogin()) {
			setCartProductIds(new Set());
			return;
		}

		try {
			const response = await cartFactory.getCartListApi();
			if (response.isSuccess && response.data) {
				const cartItems = response.data.results || [];
				// Extract product IDs from cart items
				const productIds = new Set<number>();
				cartItems.forEach((item: any) => {
					// Handle different formats of cart_product
					const productId = item.cart_product?.id || 
						item.cart_product || 
						parseInt(item.cart_product, 10);
					if (productId) {
						productIds.add(typeof productId === 'number' ? productId : parseInt(productId, 10));
					}
				});
				setCartProductIds(productIds);
			} else {
				setCartProductIds(new Set());
			}
		} catch (error: any) {
			console.error('Error loading cart items:', error);
			setCartProductIds(new Set());
		}
	}, []);

	useEffect(() => {
		loadProducts();
		loadCartItems();
	}, [categoryId, sortBy, priceFilter, loadCartItems]);

	// Reload cart items when login status changes
	useEffect(() => {
		loadCartItems();
	}, [authStore.isLogin(), loadCartItems]);

	const handleRefresh = () => {
		setIsRefreshing(true);
		loadProducts();
		loadCartItems();
	};

	const handleProductPress = (product: Product) => {
		navigate({ 
			screenName: Route.ProductDetail, 
			params: { productId: product.id } 
		});
	};

	const handleQuantityChange = (productId: number, change: number) => {
		setQuantities(prev => {
			const current = prev[productId] || 1;
			const newQuantity = Math.max(1, current + change);
			return { ...prev, [productId]: newQuantity };
		});
	};

	const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
		setToastMessage(message);
		setToastType(type);
		setShowToast(true);
	};

	const handleAddToCart = async (product: Product) => {
		if (!authStore.isLogin()) {
			showToastMessage('Please login to add items to cart', 'error');
			return;
		}

		const quantity = quantities[product.id] || 1;
		setAddingToCart(prev => ({ ...prev, [product.id]: true }));

		try {
			const user = authStore.loginData?.user;
			if (!user) {
				showToastMessage('User not logged in', 'error');
				return;
			}

			// Get user ID - check multiple possible field names
			let userId = user?.id || user?.user_id || user?.pk || user?.userId;
			
			// If user ID is not found, try to fetch it using email or username (same logic as CartFactory)
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
					if (error?.message && !error.message.includes('timeout')) {
						console.warn('Failed to fetch user ID:', error?.message);
					}
				}
			}
			
			if (!userId) {
				showToastMessage('Unable to identify user. Please try logging in again.', 'error');
				return;
			}

			// First, check if product already exists in cart
			const cartResponse = await cartFactory.getCartListApi();
			let existingCartItem = null;
			
			if (cartResponse.isSuccess && cartResponse.data) {
				const cartItems = cartResponse.data.results || [];
				existingCartItem = cartItems.find(
					(item: any) => 
						item.cart_product === product.id || 
						item.cart_product?.id === product.id ||
						item.cart_product?.toString() === product.id.toString()
				);
			}

			let result;
			if (existingCartItem) {
				// Update existing cart item quantity
				const newQuantity = (existingCartItem.cart_quantity || 0) + quantity;
				result = await cartFactory.updateCartItemApi(existingCartItem.id, {
					cart_quantity: newQuantity,
				});
			} else {
				// Add new item to cart
				result = await cartFactory.addToCartApi({
					cart_user: userId,
					cart_product: product.id.toString(), // API expects string
					cart_quantity: quantity,
					cart_status: true,
				});
			}

			if (result.isSuccess) {
				showToastMessage('Added to cart', 'success');
				// Add product ID to cart set
				setCartProductIds(prev => new Set(prev).add(product.id));
				// Reload cart items to update the button state
				loadCartItems();
			} else {
				// If add fails with unique constraint error, try to update instead
				if (result.error && result.error.includes('unique')) {
					// Try to get cart again and update
					const retryCartResponse = await cartFactory.getCartListApi();
					if (retryCartResponse.isSuccess && retryCartResponse.data) {
						const cartItems = retryCartResponse.data.results || [];
						const retryExistingItem = cartItems.find(
							(item: any) => 
								item.cart_product === product.id || 
								item.cart_product?.id === product.id ||
								item.cart_product?.toString() === product.id.toString()
						);
						
						if (retryExistingItem) {
							const newQuantity = (retryExistingItem.cart_quantity || 0) + quantity;
							const updateResult = await cartFactory.updateCartItemApi(retryExistingItem.id, {
								cart_quantity: newQuantity,
							});
							
							if (updateResult.isSuccess) {
								showToastMessage('Added to cart', 'success');
								// Reload cart items to update the button state
								loadCartItems();
								return;
							}
						}
					}
				}
				showToastMessage(result.error || 'Failed to add to cart', 'error');
			}
		} catch (error: any) {
			console.error('Error adding to cart:', error);
			showToastMessage('Failed to add item to cart', 'error');
		} finally {
			setAddingToCart(prev => ({ ...prev, [product.id]: false }));
		}
	};

	const renderProduct = ({ item, index }: { item: Product; index: number }) => {
		const isEven = index % 2 === 0;
		const isAdding = addingToCart[item.id] || false;
		const isInCart = cartProductIds.has(item.id);
		
		return (
			<View
				style={{
					width: itemWidth,
					marginLeft: isEven ? 0 : 8,
					marginRight: isEven ? 8 : 0,
					marginBottom: 20,
				}}
			>
				<Box
					backgroundColor="white"
					borderRadius={16}
					overflow="hidden"
					style={{
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.15,
						shadowRadius: 8,
						elevation: 6,
						borderWidth: 1,
						borderColor: '#F5F5F5',
					}}
				>
					{/* Product Image */}
					<TouchableOpacity
						onPress={() => handleProductPress(item)}
						activeOpacity={0.9}
					>
						<Box
							width="100%"
							height={itemWidth * 1.15}
							backgroundColor="gray5"
							justifyContent="center"
							alignItems="center"
							overflow="hidden"
						>
							{item.product_image ? (
								<Image
									source={{ uri: item.product_image }}
									style={{ width: '100%', height: '100%' }}
									resizeMode="cover"
								/>
							) : (
								<Image
									source={Images.logo}
									style={{ width: 60, height: 60, opacity: 0.3 }}
									resizeMode="contain"
								/>
							)}
						</Box>
					</TouchableOpacity>

					{/* Product Info */}
					<Box padding="m" paddingBottom="s">
						{/* Product Name - Elegant Typography with Better Spacing */}
						<Box 
							marginBottom="m"
							paddingBottom="xs"
							style={{
								borderBottomWidth: 1,
								borderBottomColor: '#F0F0F0',
							}}
						>
							<Text
								fontSize={15}
								fontFamily={fonts.semiBold}
								color="black"
								numberOfLines={2}
								lineHeight={20}
								style={{
									letterSpacing: 0.15,
								}}
							>
								{item.product_name || 'Product'}
							</Text>
						</Box>

						{/* Quantity Controls */}
						<Box
							flexDirection="row"
							alignItems="center"
							justifyContent="center"
							marginBottom="s"
						>
							<Pressable
								onPress={() => handleQuantityChange(item.id, -1)}
								disabled={isAdding || (quantities[item.id] || 1) <= 1}
							>
								<Box
									width={32}
									height={32}
									borderRadius={16}
									backgroundColor="gray5"
									justifyContent="center"
									alignItems="center"
									marginEnd="s"
									style={{ 
										opacity: (isAdding || (quantities[item.id] || 1) <= 1) ? 0.5 : 1 
									}}
								>
									<Text fontSize={18} color="black" fontFamily={fonts.bold}>−</Text>
								</Box>
							</Pressable>

							<Text
								fontSize={16}
								fontFamily={fonts.semiBold}
								color="black"
								marginHorizontal="m"
								minWidth={30}
								textAlign="center"
							>
								{quantities[item.id] || 1}
							</Text>

							<Pressable
								onPress={() => handleQuantityChange(item.id, 1)}
								disabled={isAdding}
							>
								<Box
									width={32}
									height={32}
									borderRadius={16}
									backgroundColor="gray5"
									justifyContent="center"
									alignItems="center"
									marginStart="s"
									style={{ opacity: isAdding ? 0.5 : 1 }}
								>
									<Text fontSize={18} color="black" fontFamily={fonts.bold}>+</Text>
								</Box>
							</Pressable>
						</Box>

						{/* Add to Cart Button - Full Width */}
						<Pressable
							onPress={() => handleAddToCart(item)}
							disabled={isAdding || isInCart}
							style={{
								backgroundColor: isInCart ? '#4CAF50' : (isAdding ? '#CCCCCC' : '#842B25'),
								borderRadius: 10,
								paddingVertical: 12,
								alignItems: 'center',
								justifyContent: 'center',
								marginTop: 4,
								width: '100%',
								shadowColor: isInCart ? '#4CAF50' : '#842B25',
								shadowOffset: { width: 0, height: 2 },
								shadowOpacity: 0.3,
								shadowRadius: 4,
								elevation: 3,
							}}
						>
							{isAdding ? (
								<ActivityIndicator size="small" color="white" />
							) : (
								<Text
									fontSize={15}
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
			</View>
		);
	};

	if (isLoading) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center">
					<ActivityIndicator size="large" color="#842B25" />
					<Text marginTop="m" color="gray">
						Loading products...
					</Text>
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
							<Text fontSize={20} color="white">←</Text>
						</Box>
					</Pressable>
					<Text
						fontSize={24}
						fontFamily={fonts.bold}
						color="white"
						flex={1}
					>
						{categoryName} {products.length > 0 && `(${products.length})`}
					</Text>
				</Box>
			</Box>

			{/* Sort and Filter Bar */}
			<Box
				backgroundColor="white"
				paddingHorizontal="m"
				paddingVertical="s"
				flexDirection="row"
				justifyContent="space-between"
				alignItems="center"
				style={{
					borderBottomWidth: 1,
					borderBottomColor: '#F0F0F0',
				}}
			>
				{/* Sort Button */}
				<Pressable
					onPress={() => setShowSortModal(true)}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: 8,
						paddingHorizontal: 12,
						backgroundColor: 'white',
						borderRadius: 8,
						borderWidth: 1,
						borderColor: '#E0E0E0',
						flex: 1,
						marginRight: 8,
					}}
				>
					<Text fontSize={14} fontFamily={fonts.semiBold} color="black" marginRight="xs">
						Sort:
					</Text>
					<Text fontSize={14} fontFamily={fonts.regular} color="gray" flex={1}>
						{sortBy === '-created_at' ? 'Newest' :
						 sortBy === 'created_at' ? 'Oldest' :
						 sortBy === 'product_price' ? 'Price: Low to High' :
						 sortBy === '-product_price' ? 'Price: High to Low' :
						 sortBy === 'product_name' ? 'Name: A-Z' :
						 sortBy === '-product_name' ? 'Name: Z-A' : 'Newest'}
					</Text>
					<Text fontSize={16} color="gray">▼</Text>
				</Pressable>

				{/* Filter Button */}
				<Pressable
					onPress={() => setShowFilterModal(true)}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingVertical: 8,
						paddingHorizontal: 12,
						backgroundColor: 'white',
						borderRadius: 8,
						borderWidth: 1,
						borderColor: '#E0E0E0',
						flex: 1,
						marginLeft: 8,
					}}
				>
					<Text fontSize={14} fontFamily={fonts.semiBold} color="black" marginRight="xs">
						Filter:
					</Text>
					<Text fontSize={14} fontFamily={fonts.regular} color="gray" flex={1}>
						{priceFilter === 'all' ? 'All Prices' :
						 priceFilter === 'low' ? 'Under ₹500' :
						 priceFilter === 'medium' ? '₹500 - ₹2000' :
						 priceFilter === 'high' ? 'Above ₹2000' : 'All Prices'}
					</Text>
					<Text fontSize={16} color="gray">▼</Text>
				</Pressable>
			</Box>

			{/* Sort Modal */}
			<Modal
				visible={showSortModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowSortModal(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'flex-end',
					}}
				>
					<Box
						backgroundColor="white"
						borderTopLeftRadius={20}
						borderTopRightRadius={20}
						padding="m"
						paddingTop="xl"
					>
						<Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
							<Text fontSize={20} fontFamily={fonts.bold} color="black">
								Sort By
							</Text>
							<Pressable onPress={() => setShowSortModal(false)}>
								<Text fontSize={18} color="gray">✕</Text>
							</Pressable>
						</Box>

						{[
							{ value: '-created_at', label: 'Newest First' },
							{ value: 'created_at', label: 'Oldest First' },
							{ value: 'product_price', label: 'Price: Low to High' },
							{ value: '-product_price', label: 'Price: High to Low' },
							{ value: 'product_name', label: 'Name: A-Z' },
							{ value: '-product_name', label: 'Name: Z-A' },
						].map((option) => (
							<Pressable
								key={option.value}
								onPress={() => {
									setSortBy(option.value);
									setShowSortModal(false);
								}}
								style={{
									paddingVertical: 16,
									borderBottomWidth: 1,
									borderBottomColor: '#F0F0F0',
								}}
							>
								<Box flexDirection="row" justifyContent="space-between" alignItems="center">
									<Text
										fontSize={16}
										fontFamily={sortBy === option.value ? fonts.bold : fonts.regular}
										color={sortBy === option.value ? 'red3' : 'black'}
									>
										{option.label}
									</Text>
									{sortBy === option.value && (
										<Text fontSize={18} color="red3">✓</Text>
									)}
								</Box>
							</Pressable>
						))}
					</Box>
				</View>
			</Modal>

			{/* Filter Modal */}
			<Modal
				visible={showFilterModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowFilterModal(false)}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: 'rgba(0,0,0,0.5)',
						justifyContent: 'flex-end',
					}}
				>
					<Box
						backgroundColor="white"
						borderTopLeftRadius={20}
						borderTopRightRadius={20}
						padding="m"
						paddingTop="xl"
					>
						<Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="m">
							<Text fontSize={20} fontFamily={fonts.bold} color="black">
								Filter by Price
							</Text>
							<Pressable onPress={() => setShowFilterModal(false)}>
								<Text fontSize={18} color="gray">✕</Text>
							</Pressable>
						</Box>

						{[
							{ value: 'all', label: 'All Prices' },
							{ value: 'low', label: 'Under ₹500' },
							{ value: 'medium', label: '₹500 - ₹2000' },
							{ value: 'high', label: 'Above ₹2000' },
						].map((option) => (
							<Pressable
								key={option.value}
								onPress={() => {
									setPriceFilter(option.value);
									setShowFilterModal(false);
								}}
								style={{
									paddingVertical: 16,
									borderBottomWidth: 1,
									borderBottomColor: '#F0F0F0',
								}}
							>
								<Box flexDirection="row" justifyContent="space-between" alignItems="center">
									<Text
										fontSize={16}
										fontFamily={priceFilter === option.value ? fonts.bold : fonts.regular}
										color={priceFilter === option.value ? 'red3' : 'black'}
									>
										{option.label}
									</Text>
									{priceFilter === option.value && (
										<Text fontSize={18} color="red3">✓</Text>
									)}
								</Box>
							</Pressable>
						))}
					</Box>
				</View>
			</Modal>

			{/* Products Grid */}
			<FlatList
				data={products}
				renderItem={renderProduct}
				keyExtractor={(item) => item.id.toString()}
				numColumns={2}
				contentContainerStyle={{
					padding: 16,
					paddingBottom: 40,
				}}
				columnWrapperStyle={{
					justifyContent: 'space-between',
				}}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor="#842B25"
					/>
				}
				ListEmptyComponent={
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
							No products found
						</Text>
						<Text
							fontSize={14}
							fontFamily={fonts.regular}
							color="gray"
						>
							No products available in this category
						</Text>
					</Box>
				}
			/>
			
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

