import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Box, Text, Screen, StatusBarType, Pressable } from '../components';
import { authStore } from '../stores/AuthStore';
import { goBack, Route, navigate } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { Image } from '../components/Image';
import { orderFactory } from '../factory/OrderFactory';
import { Order, OrderItem } from '../api/OrderApi';
import { showErrorMessage, getHttp } from '../core';
import { Images } from '../assets';
import { BASE_URL } from '../api/EndPoint';

// Status badge colors
const getStatusColor = (status: string) => {
	const normalizedStatus = status?.toLowerCase() || '';
	switch (normalizedStatus) {
		case 'pending':
			return '#FF9800'; // Orange
		case 'processing':
			return '#2196F3'; // Blue
		case 'shipped':
			return '#9C27B0'; // Purple
		case 'delivered':
			return '#4CAF50'; // Green
		case 'cancelled':
			return '#F44336'; // Red
		default:
			return '#9D9D9D'; // Gray
	}
};

const getStatusBgColor = (status: string) => {
	const normalizedStatus = status?.toLowerCase() || '';
	switch (normalizedStatus) {
		case 'pending':
			return '#FFF3E0'; // Light Orange
		case 'processing':
			return '#E3F2FD'; // Light Blue
		case 'shipped':
			return '#F3E5F5'; // Light Purple
		case 'delivered':
			return '#E8F5E9'; // Light Green
		case 'cancelled':
			return '#FFEBEE'; // Light Red
		default:
			return '#F5F5F5'; // Light Gray
	}
};

const formatDate = (dateString: string) => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	} catch {
		return dateString;
	}
};

const formatTime = (dateString: string) => {
	try {
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return '';
	}
};

const OrderCard: React.FC<{ order: Order; onPress: () => void }> = ({ order, onPress }) => {
	const statusColor = getStatusColor(order.order_status);
	const statusBgColor = getStatusBgColor(order.order_status);

	return (
		<Pressable onPress={onPress}>
			<Box
				backgroundColor="white"
				borderRadius={16}
				padding="m"
				marginBottom="m"
				style={{
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 3,
				}}
			>
				{/* Header Row */}
				<Box flexDirection="row" justifyContent="space-between" alignItems="flex-start" marginBottom="s">
					<Box flex={1}>
						<Text
							fontSize={12}
							fontFamily={fonts.medium}
							color="gray"
							marginBottom="xs"
						>
							Order #{order.id}
						</Text>
						<Text
							fontSize={14}
							fontFamily={fonts.regular}
							color="gray"
						>
							{formatDate(order.order_date || order.created_at)} • {formatTime(order.order_date || order.created_at)}
						</Text>
					</Box>
					<Box
						borderRadius={20}
						paddingHorizontal="s"
						paddingVertical="xs"
						style={{ backgroundColor: statusBgColor }}
					>
						<Text
							fontSize={12}
							fontFamily={fonts.semiBold}
							style={{ color: statusColor, textTransform: 'capitalize' }}
						>
							{order.order_status || 'Pending'}
						</Text>
					</Box>
				</Box>

				{/* Order Items Preview */}
				<Box marginTop="s" marginBottom="s">
					{order.order_items && order.order_items.length > 0 ? (
						<>
							{order.order_items.slice(0, 2).map((item: OrderItem, index: number) => (
								<Box
									key={`item-${item.id}-${index}`}
									flexDirection="row"
									alignItems="center"
									style={index < Math.min(2, order.order_items.length - 1) ? undefined : { marginBottom: 0 }}
									{...(index < Math.min(2, order.order_items.length - 1) && { marginBottom: 'xs' })}
								>
									<Box
										width={50}
										height={50}
										borderRadius={8}
										backgroundColor="gray5"
										marginEnd="s"
										overflow="hidden"
										justifyContent="center"
										alignItems="center"
									>
										{item.product_image ? (
											<Image
												source={{ uri: item.product_image }}
												style={{ width: 50, height: 50 }}
												resizeMode="cover"
											/>
										) : (
											<Image
												source={Images.logo}
												style={{ width: 30, height: 30, opacity: 0.3 }}
												resizeMode="contain"
											/>
										)}
									</Box>
									<Box flex={1}>
										<Text
											fontSize={14}
											fontFamily={fonts.semiBold}
											color="black"
											numberOfLines={1}
										>
											{item.product_name || 'Product'}
										</Text>
										<Text
											fontSize={12}
											fontFamily={fonts.regular}
											color="gray"
										>
											Qty: {item.quantity} × ₹{item.price}
										</Text>
									</Box>
								</Box>
							))}
							{order.order_items.length > 2 && (
								<Text
									fontSize={12}
									fontFamily={fonts.regular}
									color="gray"
									marginTop="xs"
								>
									+{order.order_items.length - 2} more item{order.order_items.length - 2 > 1 ? 's' : ''}
								</Text>
							)}
						</>
					) : (
						<Text
							fontSize={14}
							fontFamily={fonts.regular}
							color="gray"
						>
							{order.items_count || 0} item{order.items_count !== 1 ? 's' : ''}
						</Text>
					)}
				</Box>

				{/* Divider */}
				<Box
					height={1}
					backgroundColor="gray5"
					marginVertical="s"
				/>

				{/* Footer Row */}
				<Box flexDirection="row" justifyContent="space-between" alignItems="center">
					<Box>
						<Text
							fontSize={12}
							fontFamily={fonts.medium}
							color="gray"
							marginBottom="xs"
						>
							Total Amount
						</Text>
						<Text
							fontSize={18}
							fontFamily={fonts.bold}
							color="red3"
						>
							₹{order.order_total_price || '0.00'}
						</Text>
					</Box>
					<Box
						backgroundColor="gray5"
						borderRadius={8}
						paddingHorizontal="s"
						paddingVertical="xs"
					>
						<Text
							fontSize={12}
							fontFamily={fonts.semiBold}
							color="black"
						>
							View Details →
						</Text>
					</Box>
				</Box>
			</Box>
		</Pressable>
	);
};

export const OrdersScreen: React.FC = observer(() => {
	const insets = useSafeAreaInsets();
	const topPadding = Math.max(insets.top, 44);
	const [orders, setOrders] = useState<Order[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	// Default to first status filter (Pending) - always filter by status
	const [selectedStatus, setSelectedStatus] = useState<string>('pending');

	const user = authStore?.loginData?.user;

	const loadOrders = async () => {
		try {
			// Get user ID - check multiple possible field names
			let userId = user?.id || user?.user_id || user?.pk || user?.userId;
			
			console.log('Loading orders - User object:', user);
			console.log('Loading orders - User ID:', userId);
			
			// If user ID is not found, try to fetch it using email or username
			if (!userId && user) {
				try {
					const http = getHttp();
					const userEmail = user?.email || user?.userEmail;
					const userName = user?.username || user?.userName;
					
					if (userEmail || userName) {
						const searchParam = userEmail ? `email=${userEmail}` : `username=${userName}`;
						const usersUrl = `${BASE_URL}/users/?${searchParam}`;
						console.log('Fetching user ID from:', usersUrl);
						const userResult = await http.get<any>(usersUrl);
						
						if (userResult && userResult.isSuccess && userResult.data) {
							const users = userResult.data.results || userResult.data || [];
							if (users.length > 0) {
								userId = users[0].id;
								console.log('Found user ID:', userId);
							}
						}
					}
				} catch (error: any) {
					console.warn('Failed to fetch user ID:', error);
				}
			}
			
			if (!userId) {
				console.warn('No user ID found, cannot load orders');
				setOrders([]);
				setIsLoading(false);
				return;
			}

			const params: any = {
				user_id: userId,
				order_status: selectedStatus, // Always filter by status
			};

			console.log('Fetching orders with params:', params);
			const response = await orderFactory.getOrdersApi(params);
			console.log('Orders API response:', {
				isSuccess: response.isSuccess,
				hasData: !!response.data,
				resultsCount: response.data?.results?.length || 0,
				totalCount: response.data?.count || 0,
				error: response.error
			});

			if (response.isSuccess && response.data) {
				const ordersList = response.data.results || [];
				console.log('Loaded orders:', ordersList.length, 'orders');
				if (ordersList.length > 0) {
					console.log('First order sample:', {
						id: ordersList[0].id,
						status: ordersList[0].order_status,
						total: ordersList[0].order_total_price,
						itemsCount: ordersList[0].items_count
					});
				}
				setOrders(ordersList);
			} else {
				console.warn('Failed to load orders:', response.error);
				if (response.error && !response.error.includes('not found')) {
					showErrorMessage(response.error || 'Failed to load orders');
				}
				setOrders([]);
			}
		} catch (error: any) {
			console.error('Orders loading error:', error);
			showErrorMessage(error?.message || 'Failed to load orders');
			setOrders([]);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	};

	useEffect(() => {
		loadOrders();
	}, [selectedStatus]);

	useFocusEffect(
		useCallback(() => {
			loadOrders();
		}, [])
	);

	const handleRefresh = () => {
		setIsRefreshing(true);
		loadOrders();
	};

	const handleOrderPress = (order: Order) => {
		navigate({
			screenName: Route.OrderDetail,
			params: { orderId: order.id },
		});
	};

	// Order statuses from backend Order model ORDER_STATUS_CHOICES
	// Available statuses: pending, processing, shipped, delivered, cancelled
	const statusFilters = [
		{ label: 'Pending', value: 'pending' },
		{ label: 'Processing', value: 'processing' },
		{ label: 'Shipped', value: 'shipped' },
		{ label: 'Delivered', value: 'delivered' },
		{ label: 'Cancelled', value: 'cancelled' },
	];

	if (isLoading && !isRefreshing) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center">
					<ActivityIndicator size="large" color="#842B25" />
					<Text marginTop="m" color="gray" fontSize={16} fontFamily={fonts.regular}>
						Loading orders...
					</Text>
				</Box>
			</Screen>
		);
	}

	return (
		<Screen backgroundColor="gray5" statusBarType={StatusBarType.Dark}>
			<Box flex={1}>
				{/* Header */}
				<Box
					backgroundColor="red3"
					paddingBottom="m"
					paddingHorizontal="r"
					style={{ paddingTop: topPadding + 8 }}
				>
					<Box flexDirection="row" alignItems="center" marginBottom="m">
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
							My Orders
						</Text>
					</Box>

					{/* Status Filters */}
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingRight: 16 }}
					>
						{statusFilters.map((filter) => (
							<Pressable
								key={filter.value}
								onPress={() => setSelectedStatus(filter.value)}
							>
								<Box
									backgroundColor={selectedStatus === filter.value ? 'white' : undefined}
									borderRadius={20}
									paddingHorizontal="m"
									paddingVertical="xs"
									marginEnd="s"
									style={selectedStatus !== filter.value ? { backgroundColor: 'rgba(255,255,255,0.2)' } : undefined}
								>
									<Text
										fontSize={14}
										fontFamily={fonts.semiBold}
										style={{ color: selectedStatus === filter.value ? '#842B25' : 'white' }}
									>
										{filter.label}
									</Text>
								</Box>
							</Pressable>
						))}
					</ScrollView>
				</Box>

				{/* Orders List */}
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor="#842B25"
						/>
					}
				>
					{orders.length === 0 ? (
						<Box
							alignItems="center"
							justifyContent="center"
							paddingVertical="xl"
							marginTop="xl"
						>
							<Box
								width={120}
								height={120}
								borderRadius={60}
								backgroundColor="white"
								justifyContent="center"
								alignItems="center"
								marginBottom="m"
							>
								<Text fontSize={48}>📦</Text>
							</Box>
							<Text
								fontSize={20}
								fontFamily={fonts.bold}
								color="black"
								marginBottom="s"
								textAlign="center"
							>
								No Orders Found
							</Text>
							<Text
								fontSize={14}
								fontFamily={fonts.regular}
								color="gray"
								textAlign="center"
								marginBottom="xl"
							>
								{selectedStatus
									? `You don't have any ${selectedStatus} orders yet.`
									: "You haven't placed any orders yet. Start shopping to see your orders here!"}
							</Text>
							<Pressable onPress={() => navigate({ screenName: Route.Dashboard })}>
								<Box
									backgroundColor="red3"
									borderRadius={12}
									paddingVertical="m"
									paddingHorizontal="xl"
								>
									<Text
										fontSize={16}
										fontFamily={fonts.bold}
										color="white"
									>
										Start Shopping
									</Text>
								</Box>
							</Pressable>
						</Box>
					) : (
						<>
							<Box marginBottom="s">
								<Text
									fontSize={16}
									fontFamily={fonts.semiBold}
									color="gray"
								>
									{orders.length} order{orders.length !== 1 ? 's' : ''} found
								</Text>
							</Box>
							{orders.map((order) => (
								<OrderCard
									key={`order-${order.id}`}
									order={order}
									onPress={() => handleOrderPress(order)}
								/>
							))}
						</>
					)}
				</ScrollView>
			</Box>
		</Screen>
	);
});

