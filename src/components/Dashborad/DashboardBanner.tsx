import React, { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { Box } from '../Box';
import { Image } from '../Image';
import { Pressable } from '../Pressable';
import { palette } from '../../style/Palette';

export interface BannerItem {
	imageUrl: string | number;
	bannerProductId?: string | number;
}

export interface DashboardBannerProps {
	data?: BannerItem[];
	onBannerPress?: (item: BannerItem, index: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_HEIGHT = SCREEN_WIDTH / 2;
const BANNER_PADDING = 16;

const BannerItemComponent: React.FC<{ item: BannerItem; index: number; onPress?: (item: BannerItem, index: number) => void }> = ({ item, index, onPress }) => {
	const itemOpacity = useSharedValue(0);
	const pressScale = useSharedValue(1);

	useEffect(() => {
		itemOpacity.value = withTiming(1, { duration: 350 });
	}, []);

	const itemStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
		opacity: itemOpacity.value,
	}));

	const handlePressIn = () => {
		pressScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
	};

	const handlePressOut = () => {
		pressScale.value = withSpring(1, { damping: 15, stiffness: 300 });
	};

	const source = typeof item.imageUrl === 'string'
		? { uri: item.imageUrl }
		: item.imageUrl;

	return (
		<Animated.View style={[itemStyle, { width: SCREEN_WIDTH - BANNER_PADDING * 2, height: BANNER_HEIGHT }]}>
			<Pressable
				onPress={() => onPress?.(item, index)}
				onPressIn={handlePressIn}
				onPressOut={handlePressOut}
				style={{
					width: '100%',
					height: '100%',
					borderRadius: 20,
					overflow: 'hidden',
					backgroundColor: palette.gray5,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 6 },
					shadowOpacity: 0.15,
					shadowRadius: 12,
					elevation: 8,
				}}
			>
				<Image
					resizeMode="cover"
					width="100%"
					height="100%"
					source={source}
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
	const [activeIndex, setActiveIndex] = useState(0);

	useEffect(() => {
		bannerOpacity.value = withTiming(1, { duration: 400 });
	}, []);

	const bannerStyle = useAnimatedStyle(() => ({
		opacity: bannerOpacity.value,
	}));

	if (!data || data.length === 0) {
		return null;
	}

	const carouselWidth = SCREEN_WIDTH - BANNER_PADDING * 2;

	return (
		<Animated.View style={bannerStyle}>
			<Box marginTop="m" marginBottom="m" width="100%" paddingHorizontal="m">
				<Carousel
					loop
					width={carouselWidth}
					height={BANNER_HEIGHT}
					autoPlay
					data={data}
					scrollAnimationDuration={800}
					autoPlayInterval={4000}
					style={{ width: carouselWidth }}
					onSnapToItem={(index) => setActiveIndex(index)}
					renderItem={({ item, index }) => (
						<BannerItemComponent item={item} index={index} onPress={onBannerPress} />
					)}
				/>
				{data.length > 1 && (
					<Box flexDirection="row" justifyContent="center" alignItems="center" paddingTop="s">
						{data.map((_, i) => (
							<Box
								key={i}
								width={activeIndex === i ? 10 : 6}
								height={6}
								borderRadius={3}
								marginHorizontal="xs"
								style={{
									backgroundColor: activeIndex === i ? palette.primary : 'rgba(0,0,0,0.2)',
									opacity: activeIndex === i ? 1 : 0.6,
								}}
							/>
						))}
					</Box>
				)}
			</Box>
		</Animated.View>
	);
};
