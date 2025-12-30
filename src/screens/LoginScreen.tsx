import React, { useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Keyboard, Animated, TouchableOpacity, StyleSheet, View, Dimensions } from 'react-native';
import { Box, Image, Screen, StatusBarType, Text, Pressable } from '../components';
import { Images } from '../assets';
import { fonts } from '../style';
import { DeviceHelper } from '../helper/DeviceHelper';
import { AnimatedInput } from '../components/auth/AnimatedInput';
import { AnimatedButton } from '../components/auth/AnimatedButton';
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

const { width, height } = Dimensions.get('window');

// DUMMY CREDENTIALS FOR BYPASS
const DUMMY_EMAIL = 'demo@sonic.com';
const DUMMY_PASSWORD = 'demo123';

export interface LoginScreenProps {
	onNavigateToRegistration?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigateToRegistration }) => {
	const {
		control,
		handleSubmit,
		setValue,
		getValues,
		formState: { errors },
	} = useForm();
	
	const [isShowPassword, setIsShowPassword] = useState(true);
	const [keyboardStatus, setKeyboardStatus] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);

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

		// Load saved credentials if remember me was checked
		const loadSavedCredentials = async () => {
			const savedCredentials = await authStore.getSavedCredentials();
			if (savedCredentials) {
				setValue('email', savedCredentials.email);
				setValue('password', savedCredentials.password);
				setRememberMe(true);
			}
		};
		loadSavedCredentials();

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

	const submit = async () => {
		setIsLoading(true);
		const email = getValues().email;
		const password = getValues().password;

		// Check for dummy credentials first
		if (email === DUMMY_EMAIL && password === DUMMY_PASSWORD) {
			setTimeout(async () => {
				setIsLoading(false);
				showSuccessMessage('Login successful! Welcome back! 🎉');
				// Store dummy login data with complete user object structure
				await authStore.setLoginData({
					token: 'dummy_token',
					user: {
						id: 6, // Demo user ID from seed data
						username: 'demo',
						userName: 'Demo User',
						userEmail: email,
						email: email,
						first_name: 'Demo',
						last_name: 'User',
						phone_number: '+919876543215',
						company_name: 'Sonic Gold Store',
						gst: 'GST27FFFFF0000F6Z0',
						address: '100 Demo Street, Bangalore, Karnataka 560001',
						user_status: true,
						is_active: true,
					},
				}, rememberMe ? { email, password } : null);
				// Navigate to dashboard
				reset({ screenName: Route.Dashboard });
			}, 1500);
			return;
		}

		// Regular API call
		const response = await authFactory.loginApi(email, password, rememberMe);
		setIsLoading(false);
		
		if (response.isSuccess) {
			showSuccessMessage('Login successful! Welcome back! 🎉');
			// Navigate to dashboard
			reset({ screenName: Route.Dashboard });
		} else {
			showErrorMessage(response.error || 'Login failed. Please try again.');
		}
	};

	const handleOnSubmitPress = () => {
		const email = getValues().email;
		const password = getValues().password;

		if (!email || !password) {
			alert('Please fill in all required fields');
			return;
		}

		if (!utils.emailRegex().test(email)) {
			alert('Please enter a valid email address');
			return;
		}

		handleSubmit(submit)();
	};

	const getCustomValidation = (id: string) => {
		const validations: Record<string, (value: any) => string | undefined> = {};
		switch (id) {
			case 'email':
				validations.validEmail = (value: any) => {
					if (!utils.emailRegex().test(value)) {
						return 'Please enter a valid email address';
					}
					return undefined;
				};
				break;
			case 'password':
				validations.validPassword = (value: any) => {
					if (value && value.length < 6) {
						return 'Password must be at least 6 characters';
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

	const handleForgotPasswordPress = () => {
		// Navigate to Forgot Password - you can add navigation here
		console.log('Navigate to Forgot Password');
	};

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<KeyboardAwareScrollView
				extraHeight={20}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Header Image with Gradient Overlay */}
				<Animated.View
					style={[
						styles.headerContainer,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
						},
					]}
				>
					<Image
						source={Images.loginImage}
						width="100%"
						height={DeviceHelper.calculateHeightRatio(200)}
						style={styles.headerImage}
					/>
					<View style={styles.gradientOverlay} />
					
					{/* Floating Logo */}
					<Animated.View
						style={[
							styles.logoContainer,
							{
								transform: [{ scale: logoScale }],
							},
						]}
					>
						<Image
							source={Images.logo}
							height={100}
							resizeMode="contain"
							width={100}
						/>
					</Animated.View>
				</Animated.View>

				{/* Welcome Text */}
				<Animated.View
					style={[
						styles.welcomeContainer,
						{
							opacity: headerFade,
						},
					]}
				>
					<Text
						fontSize={32}
						color="black"
						fontFamily={fonts.bold}
						textAlign="center"
						marginBottom="es"
					>
						Welcome Back
					</Text>
					<Text
						fontSize={15}
						color="gray"
						fontFamily={fonts.regular}
						textAlign="center"
						lineHeight={22}
					>
						Sign in to continue your journey
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
					<Controller
						control={control}
						defaultValue=""
						name="email"
						rules={{
							required: 'Email is required',
							validate: { ...getCustomValidation('email') },
						}}
						render={({ field: { value, onChange } }) => (
							<AnimatedInput
								label="Email Address"
								value={value}
								onChangeText={onChange}
								keyboardType="email-address"
								autoCapitalize="none"
								hasError={!!errors.email}
								errorMessage={errors.email?.message as string}
								isRequired
								icon={
									<Text fontSize={20}>📧</Text>
								}
							/>
						)}
					/>

					<Controller
						control={control}
						defaultValue=""
						name="password"
						rules={{
							required: 'Password is required',
							validate: { ...getCustomValidation('password') },
						}}
						render={({ field: { value, onChange } }) => (
							<AnimatedInput
								label="Password"
								value={value}
								onChangeText={onChange}
								secureTextEntry={isShowPassword}
								hasError={!!errors.password}
								errorMessage={errors.password?.message as string}
								isRequired
								icon={
									<Text fontSize={20}>🔒</Text>
								}
								rightComponent={
									<Pressable
										onPress={() => setIsShowPassword(!isShowPassword)}
										justifyContent="center"
										alignItems="center"
										height={40}
										width={40}
									>
										<Image
											source={isShowPassword ? Images.eys_show : Images.eys_hide}
											width={24}
											height={24}
										/>
									</Pressable>
								}
							/>
						)}
					/>

					{/* Remember Me and Forgot Password Row */}
					<View style={styles.rememberForgotRow}>
						<TouchableOpacity
							onPress={() => setRememberMe(!rememberMe)}
							style={styles.rememberMeContainer}
							activeOpacity={0.7}
						>
							<View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
								{rememberMe && (
									<Text fontSize={14} color="white" fontFamily={fonts.bold}>
										✓
									</Text>
								)}
							</View>
							<Text
								fontSize={14}
								color="black"
								fontFamily={fonts.regular}
								marginLeft={8}
							>
								Remember Me
							</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleForgotPasswordPress}
							style={styles.forgotButton}
						>
							<Text
								color="red3"
								fontSize={14}
								fontFamily={fonts.bold}
							>
								Forgot Password?
							</Text>
						</TouchableOpacity>
					</View>

					{/* Login Button */}
					<AnimatedButton
						title={isLoading ? 'Signing In...' : 'Sign In'}
						onPress={handleOnSubmitPress}
						loading={isLoading}
						disabled={isLoading}
					/>
				</Animated.View>

				{/* Sign Up Link */}
				{!keyboardStatus && (
					<Animated.View
						style={[
							styles.signupContainer,
							{
								opacity: headerFade,
							},
						]}
					>
						<TouchableOpacity
							onPress={handleCreateNowOnPress}
							style={styles.signupButton}
						>
							<Text
								fontSize={15}
								color="black"
								fontFamily={fonts.regular}
							>
								Don't have an account?{' '}
							</Text>
							<Text
								fontSize={15}
								fontFamily={fonts.bold}
								color="red3"
							>
								Create now
							</Text>
						</TouchableOpacity>
					</Animated.View>
				)}
			</KeyboardAwareScrollView>
		</Screen>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		flexGrow: 1,
	},
	headerContainer: {
		position: 'relative',
		width: '100%',
		marginBottom: 10,
	},
	headerImage: {
		width: '100%',
	},
	gradientOverlay: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		height: 100,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
	},
	logoContainer: {
		position: 'absolute',
		top: '40%',
		right: 20,
		backgroundColor: 'white',
		borderRadius: 60,
		padding: 10,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	welcomeContainer: {
		paddingHorizontal: 24,
		marginTop: -10,
		marginBottom: 24,
	},
	formContainer: {
		flex: 1,
	},
	rememberForgotRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 24,
		marginBottom: 16,
		marginTop: -8,
	},
	rememberMeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 2,
		borderColor: '#842B25',
		borderRadius: 4,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
	},
	checkboxChecked: {
		backgroundColor: '#842B25',
	},
	forgotButton: {
		alignSelf: 'flex-end',
	},
	signupContainer: {
		paddingVertical: 24,
		alignItems: 'center',
	},
	signupButton: {
		flexDirection: 'row',
		alignItems: 'center',
	},
});

