import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Pressable } from '../Pressable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditional imports for react-native-reanimated
let Animated: any = null;
let useAnimatedStyle: any = null;
let useSharedValue: any = null;
let withSpring: any = null;
let withTiming: any = null;
let withDelay: any = null;

try {
	const Reanimated = require('react-native-reanimated');
	Animated = Reanimated.default;
	useAnimatedStyle = Reanimated.useAnimatedStyle;
	useSharedValue = Reanimated.useSharedValue;
	withSpring = Reanimated.withSpring;
	withTiming = Reanimated.withTiming;
	withDelay = Reanimated.withDelay;
} catch {
	const RNAnimated = require('react-native').Animated;
	Animated = RNAnimated;
	useAnimatedStyle = () => ({});
	useSharedValue = (val: number) => ({ value: val });
	withSpring = (val: any) => val;
	withTiming = (val: any) => val;
	withDelay = (delay: number, val: any) => val;
}
import { Box } from '../Box';
import { Text } from '../';
import { fonts } from '../../style';
import { palette } from '../../style/Palette';

export interface DrawerHeaderProps {
	onClose: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = observer(
	({ onClose }: DrawerHeaderProps) => {
		const insets = useSafeAreaInsets();
		const headerOpacity = useSharedValue(0);
		const translateY = useSharedValue(-8);
		const closeScale = useSharedValue(1);

		useEffect(() => {
			headerOpacity.value = withTiming(1, { duration: 350 });
			translateY.value = withDelay(50, withSpring(0, {
				damping: 16,
				stiffness: 120,
			}));
		}, []);

		const headerStyle = useAnimatedStyle(() => ({
			opacity: headerOpacity.value,
			transform: [{ translateY: translateY.value }],
		}));

		const closeStyle = useAnimatedStyle(() => ({
			transform: [{ scale: closeScale.value }],
		}));

		return (
			<Animated.View style={[headerStyle, { zIndex: 10 }]}>
				<Box
					flexDirection="row"
					alignItems="center"
					justifyContent="space-between"
					paddingHorizontal="xl"
					paddingVertical="m"
					style={{
						paddingTop: insets.top + 8,
						borderBottomWidth: 1,
						borderBottomColor: 'rgba(0,0,0,0.06)',
						backgroundColor: 'rgba(255,255,255,0.92)',
					}}
				>
					<Text
						fontSize={18}
						fontFamily={fonts.semiBold}
						style={{ color: palette.dark }}
						letterSpacing={-0.3}
					>
						Menu
					</Text>
					<Pressable
						onPress={onClose}
						onPressIn={() => { closeScale.value = withSpring(0.92, { damping: 15, stiffness: 400 }); }}
						onPressOut={() => { closeScale.value = withSpring(1, { damping: 15, stiffness: 400 }); }}
						style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: 'rgba(0,0,0,0.05)',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<Animated.Text
							style={[closeStyle, { fontSize: 20, color: palette.dark, fontWeight: '300' }]}
						>
							✕
						</Animated.Text>
					</Pressable>
				</Box>
			</Animated.View>
		);
	},
);
