import React, { useEffect } from 'react';
import { Dimensions, ScrollView, View } from 'react-native';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withSpring,
	withTiming,
} from 'react-native-reanimated';
import { Box } from '../Box';
import { Image } from '../Image';
import { Logo } from '../Logo';
import { Pressable } from '../Pressable';
import { Text } from '../Text';
import { fonts } from '../../style';
import { palette } from '../../style/Palette';
import { MEDIA_BASE_URL } from '../../api/EndPoint';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;
const COLS = 2;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP) / COLS;

export interface CategoryItem {
	id: number;
	category_name: string;
	category_image?: string | null;
}

export interface DashboardCategoryGridProps {
	categories: CategoryItem[];
	onCategoryPress: (category: CategoryItem) => void;
}

const CategoryCard: React.FC<{
	category: CategoryItem;
	index: number;
	onPress: () => void;
}> = ({ category, index, onPress }) => {
	const opacity = useSharedValue(0);
	const scale = useSharedValue(0.9);
	const pressScale = useSharedValue(1);

	useEffect(() => {
		opacity.value = withDelay(index * 80, withTiming(1, { duration: 300 }));
		scale.value = withDelay(index * 80, withSpring(1, { damping: 14, stiffness: 120 }));
	}, []);

	const style = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{ scale: scale.value * pressScale.value }],
	}));

	const hasImage = !!category.category_image;

	return (
		<Animated.View style={[style, { width: CARD_WIDTH, marginBottom: GAP }]}>
			<Pressable
				onPress={onPress}
				onPressIn={() => {
					pressScale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
				}}
				onPressOut={() => {
					pressScale.value = withSpring(1, { damping: 15, stiffness: 400 });
				}}
				style={{
					width: '100%',
					aspectRatio: 1,
					borderRadius: 16,
					overflow: 'hidden',
					backgroundColor: palette.gray5,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 4,
				}}
			>
				{hasImage ? (
					<Image
						source={{
							uri: category.category_image!.startsWith('http')
								? category.category_image!
								: `${MEDIA_BASE_URL}/${category.category_image!.replace(/^\//, '')}`,
						}}
						resizeMode="cover"
						width="100%"
						height="100%"
					/>
				) : (
					<Box
						flex={1}
						width="100%"
						height="100%"
						backgroundColor="gray5"
						alignItems="center"
						justifyContent="center"
						padding="m"
					>
						<Logo
							width={56}
							height={50}
							style={{ marginBottom: 8 }}
						/>
						<Text
							fontSize={15}
							fontFamily={fonts.semiBold}
							style={{ color: palette.dark }}
							textAlign="center"
							numberOfLines={2}
						>
							{category.category_name}
						</Text>
					</Box>
				)}
				{hasImage && (
					<Box
						position="absolute"
						bottom={0}
						left={0}
						right={0}
						paddingVertical="s"
						paddingHorizontal="m"
						style={{
							backgroundColor: 'rgba(0,0,0,0.5)',
						}}
					>
						<Text
							fontSize={14}
							fontFamily={fonts.semiBold}
							color="white"
							numberOfLines={2}
						>
							{category.category_name}
						</Text>
					</Box>
				)}
			</Pressable>
		</Animated.View>
	);
};

export const DashboardCategoryGrid: React.FC<DashboardCategoryGridProps> = ({
	categories,
	onCategoryPress,
}) => {
	if (!categories || categories.length === 0) {
		return null;
	}

	return (
		<Box paddingHorizontal="m" paddingTop="m" paddingBottom="m">
			<Text
				fontSize={18}
				fontFamily={fonts.bold}
				style={{ color: palette.dark }}
				marginBottom="m"
			>
				Shop by Category
			</Text>
			<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
				{categories.map((cat, i) => (
					<View
						key={cat.id}
						style={{
							width: CARD_WIDTH,
							marginRight: i % 2 === 0 ? GAP : 0,
							marginBottom: GAP,
						}}
					>
						<CategoryCard
							category={cat}
							index={i}
							onPress={() => onCategoryPress(cat)}
						/>
					</View>
				))}
			</View>
		</Box>
	);
};
