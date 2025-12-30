import React, { useState, useRef, useEffect } from 'react';
import { Animated, TouchableOpacity, StyleSheet, View, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Controller, useForm } from 'react-hook-form';
import { Box, CommonHeader, Image, Screen, StatusBarType, Text, Pressable } from '../components';
import { fonts } from '../style';
import { RegistrationApiParams } from '../api';
import { authFactory } from '../factory';
import { showErrorMessage, showSuccessMessage } from '../core';
import { utils } from '../Utils/Utils';
import { Images } from '../assets';
import { AnimatedInput } from '../components/auth/AnimatedInput';
import { AnimatedButton } from '../components/auth/AnimatedButton';
import {
	createFadeInAnimation,
	createSlideUpAnimation,
} from '../Utils/animations';
import { navigate, goBack, Route } from '../navigation/AppNavigation';

const { width } = Dimensions.get('window');

const STEPS = ['Personal', 'Business', 'Security'];

export interface RegistrationScreenProps {
	onNavigateToLogin?: () => void;
}

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({ onNavigateToLogin }) => {
	const [currentStep, setCurrentStep] = useState(0);
	const [isChecked, setIsChecked] = useState(false);
	const [isShowPassword, setIsShowPassword] = useState(true);
	const [isShowPasswordConfirm, setIsShowPasswordConfirm] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	const {
		control,
		handleSubmit,
		getValues,
		trigger,
		formState: { errors },
	} = useForm();

	// Animation refs
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(50)).current;
	const progressAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.parallel([
			createFadeInAnimation(fadeAnim, 600, 0),
			createSlideUpAnimation(slideAnim, 500, 100),
		]).start();

		animateProgress();
	}, [currentStep]);

	const animateProgress = () => {
		Animated.timing(progressAnim, {
			toValue: (currentStep + 1) / STEPS.length,
			duration: 400,
			useNativeDriver: false,
		}).start();
	};

	const getCustomValidation = (id: string) => {
		const validations: Record<string, (value: any) => string | undefined> = {};
		switch (id) {
			case 'phone_number':
				validations.validMono = (value: any) => {
					if (!utils.phoneNoRegexNoSpace().test(value)) {
						return 'Mobile number is not valid';
					}
					return undefined;
				};
				break;
			case 'email':
				validations.validEmail = (value: any) => {
					if (!utils.emailRegex().test(value)) {
						return 'Email is not valid';
					}
					return undefined;
				};
				break;
			case 'gst':
				validations.validGst = (value: any) => {
					if (!utils.get().test(value)) {
						return 'GST number is not valid';
					}
					return undefined;
				};
				break;
		}
		return validations;
	};

	const stepFields = [
		// Step 0: Personal Information
		[
			{
				id: 'user_name',
				label: 'Full Name',
				value: '',
				isRequired: true,
				keyBoardType: 'default',
				type: 'textInput',
				autoCapitalize: 'words',
				icon: '👤',
			},
			{
				id: 'email',
				label: 'Email Address',
				value: '',
				isRequired: true,
				keyBoardType: 'email-address',
				type: 'textInput',
				autoCapitalize: 'none',
				icon: '📧',
			},
			{
				id: 'phone_number',
				label: 'Phone Number',
				value: '',
				isRequired: true,
				keyBoardType: 'number-pad',
				type: 'textInput',
				autoCapitalize: 'none',
				icon: '📱',
			},
		],
		// Step 1: Business Information
		[
			{
				id: 'company_name',
				label: 'Company Name',
				value: '',
				isRequired: true,
				keyBoardType: 'default',
				type: 'textInput',
				autoCapitalize: 'words',
				icon: '🏢',
			},
			{
				id: 'gst',
				label: 'GST Number',
				value: '',
				isRequired: true,
				keyBoardType: 'default',
				type: 'textInput',
				autoCapitalize: 'characters',
				icon: '📋',
			},
			{
				id: 'user_address',
				label: 'Business Address',
				value: '',
				isRequired: true,
				keyBoardType: 'default',
				type: 'textArea',
				autoCapitalize: 'sentences',
				icon: '📍',
			},
		],
		// Step 2: Security
		[
			{
				id: 'password',
				label: 'Password',
				value: '',
				isRequired: true,
				keyBoardType: 'default',
				type: 'textInput',
				autoCapitalize: 'none',
				isRightComponent: true,
				icon: '🔒',
			},
			{
				id: 'confirm_password',
				label: 'Confirm Password',
				value: '',
				isRequired: true,
				keyBoardType: 'default',
				type: 'textInput',
				autoCapitalize: 'none',
				isRightComponent: true,
				icon: '🔐',
			},
		],
	];

	const validateCurrentStep = async () => {
		const currentFields = stepFields[currentStep];
		const fieldIds = currentFields.map((f) => f.id);
		const result = await trigger(fieldIds as any);
		return result;
	};

	const handleNext = async () => {
		const isValid = await validateCurrentStep();
		
		if (!isValid) {
			showErrorMessage('Please fill in all required fields correctly');
			return;
		}

		if (currentStep < STEPS.length - 1) {
			// Animate transition
			Animated.sequence([
				Animated.timing(fadeAnim, {
					toValue: 0,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
			]).start();

			setCurrentStep(currentStep + 1);
		} else {
			handleSubmit(submit)();
		}
	};

	const handleBack = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		} else {
			// Navigate back to login
			goBack();
		}
	};

	const submit = async () => {
		if (!isChecked) {
			showErrorMessage('Please accept the terms and conditions');
			return;
		}

		const password = getValues().password;
		const confirmPassword = getValues().confirm_password;

		if (password !== confirmPassword) {
			showErrorMessage('Passwords do not match');
			return;
		}

		if (password.length < 6) {
			showErrorMessage('Password must be at least 6 characters');
			return;
		}

		const params: RegistrationApiParams = {
			user_address: getValues().user_address,
			user_company_name: getValues().company_name,
			confirm_password: getValues().confirm_password,
			user_email: getValues().email,
			user_gst: getValues().gst,
			user_name: getValues().user_name,
			user_password: getValues().password,
			user_phone_number: getValues().phone_number,
		};

		setIsLoading(true);
		
		try {
			console.log('Calling registration API with params:', params);
			const response = await authFactory.registrationApi(params);
			console.log('Registration API response:', response);
			
			if (response.isSuccess) {
				// Auto-login after successful registration
				try {
					console.log('Calling login API after registration');
					const loginResponse = await authFactory.loginApi(getValues().email, getValues().password);
					console.log('Login API response:', loginResponse);
					
					if (loginResponse.isSuccess) {
						showSuccessMessage('Registration successful! Welcome! 🎉');
						// Navigate back to login
						setTimeout(() => {
							goBack();
						}, 1500);
					} else {
						showErrorMessage('Registration successful but login failed. Please login manually.');
					}
				} catch (loginError: any) {
					console.error('Login error after registration:', loginError);
					showErrorMessage('Registration successful but login failed. Please login manually.');
				}
			} else {
				showErrorMessage(response.error || 'Registration failed. Please try again.');
			}
		} catch (error: any) {
			console.error('Registration error:', error);
			showErrorMessage(error?.message || 'Registration failed. Please check your connection and try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handelPasswordShowHide = (id: string) => {
		if (id === 'password') {
			setIsShowPassword(!isShowPassword);
		} else {
			setIsShowPasswordConfirm(!isShowPasswordConfirm);
		}
	};

	const isPasswordShowHide = (id: string): boolean => {
		if (id === 'password') {
			return isShowPassword;
		}
		if (id === 'confirm_password') {
			return isShowPasswordConfirm;
		}
		return false;
	};

	const progressWidth = progressAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0%', '100%'],
	});

	return (
		<Screen backgroundColor="white" statusBarType={StatusBarType.Dark}>
			<CommonHeader label="Create Account" onBackPress={handleBack} />

			{/* Progress Bar */}
			<Box paddingHorizontal="md" marginTop="lg" marginBottom="md">
				<Box
					flexDirection="row"
					justifyContent="space-between"
					marginBottom="sm"
					style={{ marginBottom: 8 }}
				>
					{STEPS.map((step, index) => (
						<Box key={step} alignItems="center" flex={1}>
							<View
								style={[
									styles.stepCircle,
									index <= currentStep && styles.stepCircleActive,
								]}
							>
								<Text
									fontSize={12}
									fontFamily={fonts.bold}
									color={index <= currentStep ? 'white' : 'gray'}
								>
									{index + 1}
								</Text>
							</View>
							<Text
								fontSize={11}
								fontFamily={fonts.medium}
								color={index <= currentStep ? 'red3' : 'gray'}
								style={{ marginTop: 4 }}
							>
								{step}
							</Text>
						</Box>
					))}
				</Box>

				<View style={styles.progressBar}>
					<Animated.View
						style={[
							styles.progressFill,
							{
								width: progressWidth,
							},
						]}
					/>
				</View>
			</Box>

			<KeyboardAwareScrollView
				extraHeight={20}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{/* Step Title */}
				<Animated.View
					style={[
						styles.stepHeader,
						{
							opacity: fadeAnim,
							transform: [{ translateY: slideAnim }],
							marginTop: 16,
						},
					]}
				>
					<Text
						fontSize={24}
						fontFamily={fonts.bold}
						color="black"
						style={{ marginBottom: 8 }}
					>
						{STEPS[currentStep]} Info
					</Text>
					<Text
						fontSize={14}
						fontFamily={fonts.regular}
						color="gray"
						lineHeight={20}
					>
						{currentStep === 0 && 'Let\'s start with your personal details'}
						{currentStep === 1 && 'Tell us about your business'}
						{currentStep === 2 && 'Secure your account with a password'}
					</Text>
				</Animated.View>

				{/* Form Fields for Current Step */}
				<Animated.View
					style={{
						opacity: fadeAnim,
					}}
				>
					{stepFields[currentStep].map((formField) => (
						<Controller
							key={formField.id}
							control={control}
							defaultValue={formField.value}
							name={formField.id}
							rules={{
								required: formField.isRequired ? `${formField.label} is required` : false,
								validate: { ...getCustomValidation(formField.id) },
							}}
							render={({ field: { value, onChange } }) => (
								<AnimatedInput
									label={formField.label}
									value={value}
									onChangeText={onChange}
									keyboardType={formField.keyBoardType as any}
									autoCapitalize={formField.autoCapitalize as any}
									hasError={!!errors[formField.id]}
									errorMessage={errors[formField.id]?.message as string}
									secureTextEntry={
										formField.isRightComponent
											? isPasswordShowHide(formField.id)
											: false
									}
									isRequired={formField.isRequired}
									multiline={formField.type === 'textArea'}
									height={formField.type === 'textArea' ? 120 : undefined}
									icon={<Text fontSize={20}>{formField.icon}</Text>}
									rightComponent={
										formField.isRightComponent ? (
											<Pressable
												onPress={() => handelPasswordShowHide(formField.id)}
												justifyContent="center"
												alignItems="center"
												height={40}
												width={40}
											>
												<Image
													source={
														isPasswordShowHide(formField.id)
															? Images.eys_show
															: Images.eys_hide
													}
													width={24}
													height={24}
												/>
											</Pressable>
										) : undefined
									}
								/>
							)}
						/>
					))}
				</Animated.View>

				{/* Terms & Conditions (Last Step) */}
				{currentStep === STEPS.length - 1 && (
					<Animated.View
						style={[
							styles.termsContainer,
							{
								opacity: fadeAnim,
							},
						]}
					>
						<TouchableOpacity
							style={styles.checkboxContainer}
							onPress={() => setIsChecked(!isChecked)}
						>
							<View
								style={[
									styles.checkbox,
									isChecked && styles.checkboxChecked,
								]}
							>
								{isChecked && (
									<Text fontSize={16} color="white">
										✓
									</Text>
								)}
							</View>
							<Text
								fontSize={13}
								fontFamily={fonts.regular}
								color="black"
								style={{ marginLeft: 8, flex: 1 }}
							>
								I agree to the{' '}
								<Text fontSize={13} fontFamily={fonts.bold} color="red3">
									Terms & Conditions
								</Text>{' '}
								and{' '}
								<Text fontSize={13} fontFamily={fonts.bold} color="red3">
									Privacy Policy
								</Text>
							</Text>
						</TouchableOpacity>
					</Animated.View>
				)}

				{/* Action Buttons */}
				<Box marginTop="lg" paddingBottom="md">
					<AnimatedButton
						title={
							currentStep === STEPS.length - 1
								? isLoading
									? 'Creating Account...'
									: 'Create Account'
								: 'Next Step'
						}
						onPress={handleNext}
						loading={isLoading}
						disabled={isLoading}
					/>

					{currentStep > 0 && (
						<AnimatedButton
							title="Previous"
							onPress={handleBack}
							variant="outline"
						/>
					)}
				</Box>

				{/* Step Indicators */}
				<Box
					flexDirection="row"
					justifyContent="center"
					marginBottom="md"
				>
					{STEPS.map((_, index) => (
						<View
							key={index}
							style={[
								styles.dot,
								index === currentStep && styles.dotActive,
							]}
						/>
					))}
				</Box>
			</KeyboardAwareScrollView>
		</Screen>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingVertical: 16,
	},
	stepHeader: {
		paddingHorizontal: 24,
		marginBottom: 24,
	},
	progressBar: {
		height: 6,
		backgroundColor: '#E2E2E2',
		borderRadius: 3,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		backgroundColor: '#842B25',
		borderRadius: 3,
	},
	stepCircle: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: '#E2E2E2',
		justifyContent: 'center',
		alignItems: 'center',
	},
	stepCircleActive: {
		backgroundColor: '#842B25',
	},
	termsContainer: {
		paddingHorizontal: 16,
		marginTop: 8,
		marginBottom: 16,
	},
	checkboxContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	checkbox: {
		width: 24,
		height: 24,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: '#E2E2E2',
		justifyContent: 'center',
		alignItems: 'center',
	},
	checkboxChecked: {
		backgroundColor: '#842B25',
		borderColor: '#842B25',
	},
	dot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#E2E2E2',
		marginHorizontal: 4,
	},
	dotActive: {
		backgroundColor: '#842B25',
		width: 24,
	},
});

