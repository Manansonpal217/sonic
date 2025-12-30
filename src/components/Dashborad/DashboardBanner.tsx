import React, { useEffect } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { Box } from '../Box';
import { DeviceHelper } from '../../helper/DeviceHelper';
import { Image } from '../Image';
import { Pressable } from '../Pressable';

export interface BannerItem {
	imageUrl: string | number;
	bannerProductId?: string | number;
}

export interface DashboardBannerProps {
	data?: BannerItem[];
	onBannerPress?: (item: BannerItem, index: number) => void;
}

const BannerItemComponent: React.FC<{ item: BannerItem; index: number; onPress?: (item: BannerItem, index: number) => void }> = ({ item, index, onPress }) => {
	const itemScale = useSharedValue(0.95);
	const itemOpacity = useSharedValue(0);
	const pressScale = useSharedValue(1);

	useEffect(() => {
		itemScale.value = withSpring(1, {
			damping: 12,
			stiffness: 100,
		});
		itemOpacity.value = withTiming(1, { duration: 400 });
	}, []);

	const itemStyle = useAnimatedStyle(() => ({
		transform: [{ scale: itemScale.value * pressScale.value }],
		opacity: itemOpacity.value,
	}));

	const handlePressIn = () => {
		pressScale.value = withSpring(0.98, {
			damping: 15,
			stiffness: 300,
		});
	};

	const handlePressOut = () => {
		pressScale.value = withSpring(1, {
			damping: 15,
			stiffness: 300,
		});
	};

	const handleOnPress = () => {
		if (onPress) {
			onPress(item, index);
		}
	};

	return (
		<Animated.View style={[itemStyle, { width: '100%', height: '100%' }]}>
			<Pressable
				onPress={handleOnPress}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				style={{
					width: '100%',
					height: '100%',
					borderTopLeftRadius: 0,
					borderTopRightRadius: 0,
					borderBottomLeftRadius: 24,
					borderBottomRightRadius: 24,
					overflow: 'hidden',
					elevation: 4,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.2,
					shadowRadius: 8,
				}}
			>
				<Image
					resizeMode="cover"
					width="100%"
					height="100%"
					source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl}
				/>
			</Pressable>
		</Animated.View>
	);
};

export const DashboardBanner: React.FC<DashboardBannerProps> = ({
	data = [],
	onBannerPress,
}) => {
	const bannerOpacity = useSharedValue(0);
	const bannerScale = useSharedValue(0.95);

	useEffect(() => {
		bannerOpacity.value = withTiming(1, { duration: 500 });
		bannerScale.value = withSpring(1, {
			damping: 12,
			stiffness: 100,
		});
	}, []);

	const bannerStyle = useAnimatedStyle(() => ({
		opacity: bannerOpacity.value,
		transform: [{ scale: bannerScale.value }],
	}));

	if (!data || data.length === 0) {
		return null;
	}

	return (
		<Animated.View style={bannerStyle}>
			<Box
				marginTop="m"
				width="100%"
			>
				<Carousel
					loop
					width={DeviceHelper.width()}
					height={DeviceHelper.width() / 1.8}
					autoPlay
					data={data}
					scrollAnimationDuration={1000}
					autoPlayInterval={3000}
					style={{ width: '100%' }}
					onSnapToItem={(index) => {}}
					renderItem={({ item, index }) => (
						<BannerItemComponent 
							item={item} 
							index={index} 
							onPress={onBannerPress}
						/>
					)}
				/>
			</Box>
		</Animated.View>
	);
};

