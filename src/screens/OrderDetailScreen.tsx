import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { Box, Text, Screen, StatusBarType, Pressable } from '../components';
import { goBack } from '../navigation/AppNavigation';
import { fonts } from '../style';
import { Image } from '../components/Image';
import { Logo } from '../components/Logo';
import { orderFactory } from '../factory/OrderFactory';
import { Order, OrderItem } from '../api/OrderApi';
import { showErrorMessage } from '../core';
import { Images } from '../assets';
import { getMediaUrl } from '../api/EndPoint';

const getStatusColor = (status: string) => {
	const normalizedStatus = status?.toLowerCase() || '';
	switch (normalizedStatus) {
		case 'pending':
			return '#FF9800';
		case 'processing':
			return '#2196F3';
		case 'shipped':
			return '#9C27B0';
		case 'delivered':
			return '#4CAF50';
		case 'cancelled':
			return '#F44336';
		default:
			return '#9D9D9D';
	}
};

const getStatusBgColor = (status: string) => {
	const normalizedStatus = status?.toLowerCase() || '';
	switch (normalizedStatus) {
		case 'pending':
			return '#FFF3E0';
		case 'processing':
			return '#E3F2FD';
		case 'shipped':
			return '#F3E5F5';
		case 'delivered':
			return '#E8F5E9';
		case 'cancelled':
			return '#FFEBEE';
		default:
			return '#F5F5F5';
	}
};

const formatDate = (dateString: string) => {
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
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

export const OrderDetailScreen: React.FC = observer(() => {
	const insets = useSafeAreaInsets();
	const topPadding = insets.top + 8;
	const route = useRoute();
	const params = route.params as { orderId?: number } | undefined;
	const orderId = params?.orderId != null ? Number(params.orderId) : undefined;
	const [order, setOrder] = useState<Order | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (orderId == null || Number.isNaN(orderId)) {
			setIsLoading(false);
			setOrder(null);
			return;
		}
		const loadOrder = async () => {
			try {
				setIsLoading(true);
				const response = await orderFactory.getOrderApi(orderId);

				if (response.isSuccess && response.data) {
					setOrder(response.data);
				} else {
					showErrorMessage(response.error || 'Failed to load order details');
				}
			} catch (error: any) {
				showErrorMessage(error?.message || 'Failed to load order details');
			} finally {
				setIsLoading(false);
			}
		};

		loadOrder();
	}, [orderId]);

	if (isLoading) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center">
					<ActivityIndicator size="large" color="#842B25" />
					<Text marginTop="m" color="gray" fontSize={16} fontFamily={fonts.regular}>
						Loading order details...
					</Text>
				</Box>
			</Screen>
		);
	}

	if (!order) {
		return (
			<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
				<Box flex={1} justifyContent="center" alignItems="center" paddingHorizontal="r">
					<Text fontSize={18} fontFamily={fonts.bold} color="black" marginBottom="s">
						Order not found
					</Text>
					<Text fontSize={14} fontFamily={fonts.regular} color="gray" textAlign="center" marginBottom="xl">
						The order you're looking for doesn't exist or has been removed.
					</Text>
					<Pressable onPress={goBack}>
						<Box
							backgroundColor="red3"
							borderRadius={12}
							paddingVertical="m"
							paddingHorizontal="xl"
						>
							<Text fontSize={16} fontFamily={fonts.bold} color="white">
								Go Back
							</Text>
						</Box>
					</Pressable>
				</Box>
			</Screen>
		);
	}

	const statusColor = getStatusColor(order.order_status);
	const statusBgColor = getStatusBgColor(order.order_status);
	const orderItems = Array.isArray(order.order_items) ? order.order_items : [];

	return (
		<Screen backgroundColor="gray5" statusBarType={StatusBarType.Dark}>
			{/* Header */}
			<Box
				backgroundColor="red3"
				paddingBottom="m"
				paddingHorizontal="r"
				style={{ paddingTop: topPadding + 8 }}
			>
				<Box flexDirection="row" alignItems="center">
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
					<Text fontSize={24} fontFamily={fonts.bold} color="white">
						Order Details
					</Text>
				</Box>
			</Box>

			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Order Status Card */}
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
					<Box flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="s">
						<Text fontSize={14} fontFamily={fonts.medium} color="gray">
							Order #{order.id}
						</Text>
						<Box
							backgroundColor={statusBgColor}
							borderRadius={20}
							paddingHorizontal="s"
							paddingVertical="xs"
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
					<Text fontSize={12} fontFamily={fonts.regular} color="gray">
						Placed on {formatDate(order.order_date || order.created_at || '')} at {formatTime(order.order_date || order.created_at || '')}
					</Text>
				</Box>

				{/* Order Items */}
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
					<Text
						fontSize={18}
						fontFamily={fonts.bold}
						color="black"
						marginBottom="m"
					>
						Order Items ({orderItems.length || order.items_count || 0})
					</Text>

					{orderItems.length > 0 ? (
						<>
							{orderItems.map((item: OrderItem, index: number) => {
								const imageUri = item?.product_image ? getMediaUrl(item.product_image) : null;
								const hasValidImage = !!imageUri && typeof imageUri === 'string' && imageUri.length > 0;
								const variantDisplay = item?.product_variant_display;
								const hasVariantDisplay = variantDisplay && typeof variantDisplay === 'object' && Object.keys(variantDisplay).length > 0;
								return (
								<Box
									key={`item-${item?.id ?? index}-${index}`}
									flexDirection="row"
									{...(index < orderItems.length - 1 && { marginBottom: 'm', paddingBottom: 'm' })}
									style={
										index < orderItems.length - 1
											? { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' }
											: { marginBottom: 0, paddingBottom: 0 }
									}
								>
									<Box
										width={80}
										height={80}
										borderRadius={12}
										backgroundColor="gray5"
										marginEnd="m"
										overflow="hidden"
										justifyContent="center"
										alignItems="center"
									>
										{hasValidImage ? (
											<Image
												source={{ uri: imageUri }}
												style={{ width: 80, height: 80 }}
												resizeMode="cover"
											/>
										) : (
											<Logo
												width={50}
												height={45}
												style={{ opacity: 0.3 }}
											/>
										)}
									</Box>
									<Box flex={1}>
										<Text
											fontSize={16}
											fontFamily={fonts.bold}
											color="black"
											marginBottom="xs"
										>
											{item?.product_name || 'Product'}
										</Text>
										<Text
											fontSize={14}
											fontFamily={fonts.regular}
											color="gray"
											marginBottom="xs"
										>
											Quantity: {item?.quantity ?? 0}
										</Text>
										{hasVariantDisplay && (
											<Text fontSize={14} fontFamily={fonts.regular} color="gray">
												{Object.entries(variantDisplay).map(([k, v]) => `${k}: ${v}`).join(', ')}
											</Text>
										)}
									</Box>
								</Box>
							);
							})}
						</>
					) : (
						<Text fontSize={14} fontFamily={fonts.regular} color="gray">
							No items found
						</Text>
					)}
				</Box>

				{/* Order Notes */}
				{order.order_notes && (
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
						<Text
							fontSize={18}
							fontFamily={fonts.bold}
							color="black"
							marginBottom="s"
						>
							Order Notes
						</Text>
						<Text fontSize={14} fontFamily={fonts.regular} color="gray">
							{order.order_notes}
						</Text>
					</Box>
				)}

				{/* Order Summary - no price displayed per plan */}
				<Box
					backgroundColor="white"
					borderRadius={16}
					padding="m"
					style={{
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.1,
						shadowRadius: 8,
						elevation: 3,
					}}
				>
					<Text
						fontSize={18}
						fontFamily={fonts.bold}
						color="black"
						marginBottom="m"
					>
						Order Summary
					</Text>
					<Text fontSize={14} fontFamily={fonts.regular} color="gray">
						{orderItems.length} item(s)
					</Text>
				</Box>
			</ScrollView>
		</Screen>
	);
});

