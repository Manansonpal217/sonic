import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';

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
	// Fallback to React Native Animated
	const RNAnimated = require('react-native').Animated;
	Animated = RNAnimated;
	useAnimatedStyle = () => ({});
	useSharedValue = (val: number) => ({ value: val });
	withSpring = (val: any) => val;
	withTiming = (val: any) => val;
	withDelay = (delay: number, val: any) => val;
}
import { Box } from '../Box';
import { Image, Text } from '../';
import { DeviceHelper } from '../../helper/DeviceHelper';
import { Images } from '../../assets';
import { fonts } from '../../style';
import { authStore } from '../../stores/AuthStore';

export interface DrawerHeaderProps {
	onClose: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = observer(
	({ onClose }: DrawerHeaderProps) => {
		const avatarScale = useSharedValue(0);
		const avatarOpacity = useSharedValue(0);
		const contentTranslateX = useSharedValue(-30);
		const contentOpacity = useSharedValue(0);
		const headerOpacity = useSharedValue(0);

		useEffect(() => {
			headerOpacity.value = withTiming(1, { duration: 300 });
			avatarScale.value = withDelay(100, withSpring(1, {
				damping: 10,
				stiffness: 100,
			}));
			avatarOpacity.value = withDelay(100, withTiming(1, { duration: 300 }));
			contentTranslateX.value = withDelay(200, withSpring(0, {
				damping: 12,
				stiffness: 100,
			}));
			contentOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
		}, []);

		const avatarStyle = useAnimatedStyle(() => ({
			transform: [{ scale: avatarScale.value }],
			opacity: avatarOpacity.value,
		}));

		const contentStyle = useAnimatedStyle(() => ({
			transform: [{ translateX: contentTranslateX.value }],
			opacity: contentOpacity.value,
		}));

		const headerStyle = useAnimatedStyle(() => ({
			opacity: headerOpacity.value,
		}));

		return (
			<Animated.View style={headerStyle}>
				<Box
					height={DeviceHelper.calculateHeightRatio(160)}
					backgroundColor="red3"
					justifyContent="center"
					paddingTop="m"
					paddingBottom="m"
				>
					{authStore.isLogin() ? (
						<Box marginHorizontal="r" flexDirection="row" alignItems="center">
							<Animated.View style={avatarStyle}>
								{authStore?.loginData?.user?.profilePic ? (
									<Box
										borderWidth={3}
										borderColor="white"
										borderRadius={35}
										padding={2}
									>
										<Image
											source={{ uri: authStore?.loginData?.user?.profilePic }}
											height={DeviceHelper.calculateHeightRatio(70)}
											width={DeviceHelper.calculateWidthRatio(70)}
											borderRadius={35}
										/>
									</Box>
								) : (
									<Box
										justifyContent={'center'}
										alignItems="center"
										height={DeviceHelper.calculateHeightRatio(70)}
										width={DeviceHelper.calculateWidthRatio(70)}
										borderRadius={35}
										backgroundColor={'white'}
										borderWidth={3}
										borderColor="white"
									>
										<Text
											fontSize={28}
											fontFamily={fonts.semiBold}
											color={'red3'}
											textAlign={'center'}
										>
											{authStore?.loginData?.user?.userName?.charAt(0)?.toUpperCase() || 'U'}
										</Text>
									</Box>
								)}
							</Animated.View>

							<Animated.View style={[{ flex: 1, marginStart: 16 }, contentStyle]}>
								<Box marginStart="r" flex={1}>
									<Text
										fontSize={18}
										fontFamily={fonts.semiBold}
										color="white"
										marginBottom="es"
										numberOfLines={1}
									>
										{authStore?.loginData?.user?.userName || 'User'}
									</Text>
									<Text
										fontSize={13}
										fontFamily={fonts.regular}
										color="white6"
										marginBottom="es"
										numberOfLines={1}
									>
										{authStore?.loginData?.user?.userEmail || ''}
									</Text>
									{authStore?.loginData?.user?.userAddress ? (
										<Text
											fontSize={12}
											fontFamily={fonts.regular}
											color="white6"
											numberOfLines={1}
										>
											{authStore?.loginData?.user?.userAddress}
										</Text>
									) : null}
								</Box>
							</Animated.View>
						</Box>
					) : (
						<Box flexDirection="row" marginHorizontal="r" alignItems="center">
							<Animated.View style={avatarStyle}>
								<Box
									justifyContent="center"
									alignItems="center"
									height={DeviceHelper.calculateHeightRatio(70)}
									width={DeviceHelper.calculateWidthRatio(70)}
									borderRadius={35}
									backgroundColor="white"
									borderWidth={3}
									borderColor="white"
								>
									<Image source={Images.profile} height={40} width={40} />
								</Box>
							</Animated.View>
							<Animated.View style={[{ marginStart: 16 }, contentStyle]}>
								<Box marginStart="r">
									<Text
										fontSize={20}
										fontFamily={fonts.bold}
										color="white"
										marginBottom="es"
									>
										Welcome Guest
									</Text>
									<Text fontSize={14} fontFamily={fonts.regular} color="white6">
										Sign in to continue
									</Text>
								</Box>
							</Animated.View>
						</Box>
					)}
				</Box>
			</Animated.View>
		);
	},
);

