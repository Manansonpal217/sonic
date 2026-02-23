import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Box, Screen, StatusBarType, DrawerMenu, DashboardHeader, DashboardBanner, DashboardCategoryGrid, BannerItem, CategoryItem } from '../components';
import { navigate, Route } from '../navigation/AppNavigation';
import { getHttp } from '../core';
import { BANNERS_ACTIVE, CATEGORIES_ACTIVE } from '../api/EndPoint';

export const DashboardScreen: React.FC = () => {
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [searchText, setSearchText] = useState('');
	const [bannerData, setBannerData] = useState<BannerItem[]>([]);
	const [categories, setCategories] = useState<CategoryItem[]>([]);
	const refreshNotificationCountRef = useRef<(() => void) | null>(null);
	const refreshCartCountRef = useRef<(() => void) | null>(null);

	// Fetch active banners from API
	useEffect(() => {
		const fetchBanners = async () => {
			try {
				const http = getHttp();
				const result = await http.get<Array<{ id: number; banner_image?: string; banner_product_id?: number; banner_title?: string }>>(BANNERS_ACTIVE());
				if (result?.isSuccess && result?.data) {
					const items: BannerItem[] = (result.data as any[]).map((b) => ({
						imageUrl: b.banner_image || '',
						bannerProductId: b.banner_product_id ? String(b.banner_product_id) : undefined,
					})).filter((b) => b.imageUrl);
					setBannerData(items);
				}
			} catch (e) {
				if (__DEV__) {
					console.warn('Banner fetch failed:', (e as Error)?.message);
				}
			}
		};
		fetchBanners();
	}, []);

	// Fetch active categories for grid
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const http = getHttp();
				const result = await http.get<CategoryItem[]>(CATEGORIES_ACTIVE());
				if (result?.isSuccess && result?.data) {
					setCategories((result.data as any[]) || []);
				}
			} catch (e) {
				if (__DEV__) {
					console.warn('Categories fetch failed:', (e as Error)?.message);
				}
			}
		};
		fetchCategories();
	}, []);

	const handleCategoryPress = (category: CategoryItem) => {
		navigate({
			screenName: Route.ProductList,
			params: {
				categoryId: category.id,
				categoryName: category.category_name,
			},
		});
	};

	const handleBannerPress = (item: BannerItem, index: number) => {
		if (item.bannerProductId) {
			navigate({
				screenName: Route.ProductDetail,
				params: { productId: item.bannerProductId },
			});
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
						<DashboardCategoryGrid
							categories={categories}
							onCategoryPress={handleCategoryPress}
						/>
					</ScrollView>
				</Box>
			</DrawerMenu>
		</Screen>
	);
};

