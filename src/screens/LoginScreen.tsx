import React, { useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Keyboard, Animated, TouchableOpacity, StyleSheet, View, Dimensions } from 'react-native';
import { Image, Screen, StatusBarType, Text, Toast } from '../components';
import { Images } from '../assets';
import { fonts } from '../style';
import { DeviceHelper } from '../helper/DeviceHelper';
import { AnimatedInput } from '../components/auth/AnimatedInput';
import { AnimatedButton } from '../components/auth/AnimatedButton';
import { OTPInput } from '../components/auth/OTPInput';
import { 
	createFadeInAnimation, 
	createSlideUpAnimation,
	createScaleAnimation 
} from '../Utils/animations';
import { utils } from '../Utils/Utils';
import { authFactory } from '../factory';
import { showErrorMessage, showSuccessMessage } from '../core';
import { navigate, reset, Route } from '../navigation/AppNavigation';
import { authStore } from '../stores/AuthStore';

const { width } = Dimensions.get('window');

export interface LoginScreenProps {
	onNavigateToRegistration?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegistration }) => {
	const {
		control,
		handleSubmit,
		getValues,
		setValue,
		formState: { errors },
	} = useForm();
	
	const [step, setStep] = useState<'phone' | 'otp'>('phone'); // 'phone' or 'otp'
	const [phoneNumber, setPhoneNumber] = useState('');
	const [otpCode, setOtpCode] = useState('');
	const [keyboardStatus, setKeyboardStatus] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [otpSent, setOtpSent] = useState(false);
	const [resendTimer, setResendTimer] = useState(0);
	const [toastMessage, setToastMessage] = useState('');
	const [toastVisible, setToastVisible] = useState(false);

	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const logoScale = useRef(new Animated.Value(0)).current;
	const headerFade = useRef(new Animated.Value(0)).current;
	const formSlide = useRef(new Animated.Value(50)).current;

	useEffect(() => {
		// Keyboard listeners
		const showListener = Keyboard.addListener('keyboardDidShow', () => {
			setKeyboardStatus(true);
		});
		const hideListener = Keyboard.addListener('keyboardDidHide', () => {
			setKeyboardStatus(false);
		});

		// Start entrance animations
		Animated.parallel([
			createFadeInAnimation(fadeAnim, 800, 0),
			createSlideUpAnimation(slideAnim, 600, 100),
			createScaleAnimation(logoScale, 1, 600, 200),
			createFadeInAnimation(headerFade, 600, 300),
			createSlideUpAnimation(formSlide, 600, 400),
		]).start();

		return () => {
			showListener.remove();
			hideListener.remove();
		};
	}, []);

	// Resend timer countdown
	useEffect(() => {
		if (resendTimer > 0) {
			const timer = setTimeout(() => {
				setResendTimer(resendTimer - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [resendTimer]);

	const handleSendOTP = async () => {
		const phone = getValues().phone_number;
		if (!phone) {
			showErrorMessage('Please enter your phone number');
			return;
		}

		if (!utils.phoneNoRegexNoSpace().test(phone)) {
			showErrorMessage('Please enter a valid phone number');
			return;
		}

		setIsLoading(true);
		setPhoneNumber(phone);

		try {
			const response = await authFactory.sendOTP(phone);
			
			if (response.isSuccess) {
				setOtpSent(true);
				setStep('otp');
				setResendTimer(60); // 60 seconds countdown
			} else {
				const err = response.error || '';
				const isNotRegistered = /not registered|sign up/i.test(err);
				if (isNotRegistered) {
					setToastMessage("This number isn't registered. Create a new account to get started.");
					setToastVisible(true);
				} else {
					showErrorMessage(err || 'Failed to send OTP. Please try again.');
				}
			}
		} catch (error: any) {
			const msg = error?.message || '';
			const isNotRegistered = /not registered|sign up/i.test(msg);
			if (isNotRegistered) {
				setToastMessage("This number isn't registered. Create a new account to get started.");
				setToastVisible(true);
			} else {
				showErrorMessage(msg || 'Failed to send OTP. Please check your connection.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleVerifyOTP = async () => {
		if (otpCode.length !== 6) {
			showErrorMessage('Please enter the complete 6-digit OTP code');
			return;
		}

		setIsLoading(true);

		try {
			const response = await authFactory.verifyOTP(phoneNumber, otpCode);
			
			if (response.isSuccess) {
				if (response.data) {
					await authStore.setLoginData(response.data);
				}
				const isApproved = response.data?.user?.is_approved === true;
				if (isApproved) {
					showSuccessMessage('Login successful! Welcome back! 🎉');
					reset({ screenName: Route.Dashboard });
				} else {
					showSuccessMessage('You are logged in. Your account is pending approval.');
					reset({ screenName: Route.ApprovalPending });
				}
			} else {
				const err = response.error || '';
				const isNotRegistered = /no account|not registered|sign up/i.test(err);
				if (isNotRegistered) {
					setToastMessage("This number isn't registered. Create a new account to get started.");
					setToastVisible(true);
				} else {
					showErrorMessage(err || 'Invalid OTP code. Please try again.');
				}
			}
		} catch (error: any) {
			const msg = error?.message || '';
			const isNotRegistered = /no account|not registered|sign up/i.test(msg);
			if (isNotRegistered) {
				setToastMessage("This number isn't registered. Create a new account to get started.");
				setToastVisible(true);
			} else {
				showErrorMessage(msg || 'Failed to verify OTP. Please try again.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendOTP = async () => {
		if (resendTimer > 0) {
			return; // Don't resend if timer is active
		}

		await handleSendOTP();
	};

	const handleBackToPhone = () => {
		setStep('phone');
		setOtpCode('');
		setOtpSent(false);
		setResendTimer(0);
	};

	const getCustomValidation = (id: string) => {
		const validations: Record<string, (value: any) => string | undefined> = {};
		switch (id) {
			case 'phone_number':
				validations.validPhone = (value: any) => {
					if (value && !utils.phoneNoRegexNoSpace().test(value)) {
						return 'Please enter a valid phone number';
					}
					return undefined;
				};
				break;
		}
		return validations;
	};

	const handleCreateNowOnPress = () => {
		navigate({ screenName: Route.Registration });
	};

	return (
		<Screen backgroundColor="beige" statusBarType={StatusBarType.Dark}>
			<KeyboardAwareScrollView
				extraHeight={20}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Elegant header - cream gradient with centered INARA logo */}
				<Animated.View
					style={[
						styles.headerContainer,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					<View style={styles.headerGradient} />
					
					{/* Centered INARA logo - refined, classy presentation */}
					<Animated.View
						style={[
							styles.logoContainer,
							{
								transform: [{ scale: logoScale }],
							},
						]}
					>
						<Image
							source={Images.loginLogo}
							style={styles.loginLogoImage}
							resizeMode="contain"
						/>
						<View style={styles.logoAccent} />
					</Animated.View>
				</Animated.View>

				{/* Welcome text - refined typography */}
				<Animated.View
					style={[
						styles.welcomeContainer,
						{
							opacity: headerFade,
						},
					]}
				>
					<Text
						fontSize={26}
						color="dark"
						fontFamily={fonts.semiBold}
						textAlign="center"
						marginBottom="xs"
						letterSpacing={0.5}
					>
						{step === 'phone' ? 'Welcome Back' : 'Verify Your Number'}
					</Text>
					<Text
						fontSize={14}
						color="gray"
						fontFamily={fonts.regular}
						textAlign="center"
						lineHeight={22}
						letterSpacing={0.3}
					>
						{step === 'phone' 
							? 'Sign in with your phone number to continue'
							: `Code sent to ${phoneNumber}`
						}
					</Text>
				</Animated.View>

				{/* Form Fields */}
				<Animated.View
					style={[
						styles.formContainer,
						{
							opacity: headerFade,
							transform: [{ translateY: formSlide }],
						},
					]}
				>
					{step === 'phone' ? (
						<>
							<Controller
								control={control}
								defaultValue=""
								name="phone_number"
								rules={{
									required: 'Phone number is required',
									validate: { ...getCustomValidation('phone_number') },
								}}
								render={({ field: { value, onChange } }) => (
									<AnimatedInput
										label="Phone Number"
										value={value}
										onChangeText={onChange}
										keyboardType="phone-pad"
										autoCapitalize="none"
										hasError={!!errors.phone_number}
										errorMessage={errors.phone_number?.message as string}
										isRequired
									/>
								)}
							/>

							{/* Send OTP Button */}
							<AnimatedButton
								title={isLoading ? 'Sending OTP...' : 'Send OTP'}
								onPress={handleSendOTP}
								loading={isLoading}
								disabled={isLoading}
							/>
						</>
					) : (
						<>
							{/* Back button - subtle */}
							<TouchableOpacity
								onPress={handleBackToPhone}
								style={styles.backButton}
								activeOpacity={0.7}
							>
								<Text
									color="gray"
									fontSize={13}
									fontFamily={fonts.medium}
									letterSpacing={0.2}
								>
									← Change number
								</Text>
							</TouchableOpacity>

							{/* OTP Input */}
							<OTPInput
								value={otpCode}
								onChangeText={setOtpCode}
								length={6}
								hasError={false}
							/>

							{/* Resend OTP */}
							<View style={styles.resendContainer}>
								<Text
									fontSize={14}
									color="gray"
									fontFamily={fonts.regular}
									textAlign="center"
								>
									Didn't receive the code?{' '}
								</Text>
								{resendTimer > 0 ? (
									<Text
										fontSize={14}
										color="gray"
										fontFamily={fonts.medium}
										textAlign="center"
									>
										Resend in {resendTimer}s
									</Text>
								) : (
									<TouchableOpacity onPress={handleResendOTP}>
										<Text
											fontSize={14}
											fontFamily={fonts.bold}
											color="red3"
											textAlign="center"
										>
											Resend OTP
										</Text>
									</TouchableOpacity>
								)}
							</View>

							{/* Verify OTP Button */}
							<AnimatedButton
								title={isLoading ? 'Verifying...' : 'Verify OTP'}
								onPress={handleVerifyOTP}
								loading={isLoading}
								disabled={isLoading || otpCode.length !== 6}
							/>
						</>
					)}
				</Animated.View>

				{/* Sign Up Link - refined */}
				{!keyboardStatus && (
					<Animated.View
						style={[
							styles.signupContainer,
							{
								opacity: headerFade,
							},
						]}
					>
						<View style={styles.signupDivider} />
						<TouchableOpacity
							onPress={handleCreateNowOnPress}
							style={styles.signupButton}
							activeOpacity={0.7}
						>
							<Text
								fontSize={14}
								color="gray"
								fontFamily={fonts.regular}
								letterSpacing={0.2}
							>
								Don't have an account?{' '}
							</Text>
							<Text
								fontSize={14}
								fontFamily={fonts.semiBold}
								color="red3"
								letterSpacing={0.3}
							>
								Create now
							</Text>
						</TouchableOpacity>
					</Animated.View>
				)}
			</KeyboardAwareScrollView>
			<Toast
				message={toastMessage}
				type="error"
				visible={toastVisible}
				onHide={() => setToastVisible(false)}
				duration={4500}
			/>
		</Screen>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
		paddingBottom: 24,
	},
	headerContainer: {
		position: 'relative',
		width: '100%',
		height: DeviceHelper.calculateHeightRatio(140),
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 0,
	},
	headerGradient: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: '#EFE2D9',
	},
	logoContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'white',
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 32,
		shadowColor: '#2B2A29',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.06,
		shadowRadius: 12,
		elevation: 4,
	},
	loginLogoImage: {
		width: Math.min(width * 0.55, 220),
		height: Math.min(width * 0.18, 72),
	},
	logoAccent: {
		width: 36,
		height: 3,
		backgroundColor: '#DF1D3F',
		borderRadius: 2,
		marginTop: 10,
		opacity: 0.7,
	},
	welcomeContainer: {
		paddingHorizontal: 24,
		marginTop: 12,
		marginBottom: 12,
	},
	formContainer: {
		flex: 1,
	},
	backButton: {
		alignSelf: 'flex-start',
		marginLeft: 16,
		marginBottom: 16,
	},
	resendContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 24,
		marginTop: -8,
	},
	signupContainer: {
		paddingVertical: 20,
		alignItems: 'center',
		paddingHorizontal: 24,
	},
	signupDivider: {
		width: 48,
		height: 1,
		backgroundColor: '#E2E2E2',
		marginBottom: 20,
	},
	signupButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});
