import React, { useState, useEffect } from 'react';
import { KeyboardAwareScrollView, StyleSheet } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { Box, Text, Screen, CommonHeader, Pressable, StatusBarType } from '../components';
import { goBack, navigate, Route } from '../navigation/AppNavigation';
import { showErrorMessage, showSuccessMessage, getHttp } from '../core';
import { PRODUCT_LEADS } from '../api/EndPoint';
import { AnimatedInput } from '../components/auth/AnimatedInput';
import { AnimatedButton } from '../components/auth/AnimatedButton';
import { fonts } from '../style';
import { utils } from '../Utils/Utils';

const LAST_COMPANY_KEY = '@lead_last_company';

export interface LeadFormScreenProps {
	route?: {
		params?: {
			productId: number;
			productName?: string;
		};
	};
}

interface LeadFormData {
	company_name: string;
	phone_number: string;
	user_name: string;
	email: string;
	gst: string;
	user_address: string;
}

export const LeadFormScreen: React.FC<LeadFormScreenProps> = ({ route }) => {
	const productId = route?.params?.productId ?? 0;
	const productName = route?.params?.productName;
	const [isLoading, setIsLoading] = useState(false);
	const [submitSuccess, setSubmitSuccess] = useState(false);

	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<LeadFormData>({
		defaultValues: {
			company_name: '',
			phone_number: '',
			user_name: '',
			email: '',
			gst: '',
			user_address: '',
		},
	});

	// Pre-fill from last submitted company (todo 4: load from Storage on mount)
	useEffect(() => {
		let cancelled = false;
		const loadLastCompany = async () => {
			try {
				const { Storage } = await import('../core/Storage');
				const stored = await Storage.get<LeadFormData>(LAST_COMPANY_KEY);
				if (cancelled || !stored) return;
				if (stored.company_name) setValue('company_name', stored.company_name);
				if (stored.phone_number) setValue('phone_number', stored.phone_number);
				if (stored.user_name) setValue('user_name', stored.user_name);
				if (stored.email) setValue('email', stored.email);
				if (stored.gst) setValue('gst', stored.gst);
				if (stored.user_address) setValue('user_address', stored.user_address);
			} catch {
				// ignore
			}
		};
		loadLastCompany();
		return () => {
			cancelled = true;
		};
	}, [setValue]);

	const onSubmit = async (data: LeadFormData) => {
		if (!productId) {
			showErrorMessage('Product is missing.');
			return;
		}
		setIsLoading(true);
		try {
			const http = getHttp();
			const payload = {
				product: productId,
				company_name: data.company_name.trim(),
				phone_number: data.phone_number.trim(),
				user_name: data.user_name?.trim() || undefined,
				email: data.email?.trim() || undefined,
				gst: data.gst?.trim() || undefined,
				address: data.user_address?.trim() || undefined,
			};
			await http.post(PRODUCT_LEADS(), payload);
			// Store last company for pre-fill on next scan (todo 4)
			try {
				const { Storage } = await import('../core/Storage');
				await Storage.set(LAST_COMPANY_KEY, {
					company_name: data.company_name.trim(),
					phone_number: data.phone_number.trim(),
					user_name: data.user_name?.trim() ?? '',
					email: data.email?.trim() ?? '',
					gst: data.gst?.trim() ?? '',
					user_address: data.user_address?.trim() ?? '',
				});
			} catch {
				// ignore
			}
			setSubmitSuccess(true);
			showSuccessMessage('Lead submitted successfully.');
		} catch (err: any) {
			const msg = err?.response?.data?.error || err?.message || 'Failed to submit lead.';
			showErrorMessage(msg);
		} finally {
			setIsLoading(false);
		}
	};

	if (submitSuccess) {
		return (
			<Screen statusBarType={StatusBarType.Dark}>
				<CommonHeader label="Lead submitted" onBackPress={goBack} />
				<Box flex={1} padding="xl" justifyContent="center" alignItems="center">
					<Text variant="header" marginBottom="m">
						Thank you
					</Text>
					<Text variant="body" textAlign="center" marginBottom="xl">
						Lead has been submitted successfully.
					</Text>
					<Pressable onPress={() => navigate({ screenName: Route.ScanQR })}>
						<Box backgroundColor="primary" paddingHorizontal="xl" paddingVertical="m" borderRadius={8} marginBottom="m">
							<Text color="white" fontFamily={fonts.medium}>
								Scan another product
							</Text>
						</Box>
					</Pressable>
					<Pressable onPress={goBack}>
						<Box paddingVertical="m">
							<Text color="primary" fontFamily={fonts.medium}>
								Done
							</Text>
						</Box>
					</Pressable>
				</Box>
			</Screen>
		);
	}

	return (
		<Screen statusBarType={StatusBarType.Dark}>
			<CommonHeader
				label={productName ? `Lead: ${productName}` : 'Product lead'}
				onBackPress={goBack}
			/>
			<KeyboardAwareScrollView
				extraHeight={20}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<Box paddingHorizontal="md" paddingBottom="xl">
					<Text variant="body" marginBottom="l">
						Company name and phone number are required. Other fields are optional.
					</Text>

					<Controller
						control={control}
						name="company_name"
						rules={{
							required: 'Company name is required',
						}}
						render={({ field: { onChange, value } }) => (
							<Box marginBottom="m">
								<AnimatedInput
									label="Company name"
									value={value}
									onChangeText={onChange}
									placeholder="Company name"
									isRequired
									hasError={!!errors.company_name}
									errorMessage={errors.company_name?.message}
								/>
							</Box>
						)}
					/>

					<Controller
						control={control}
						name="phone_number"
						rules={{
							required: 'Phone number is required',
							validate: (v) =>
								!v || utils.phoneNoRegexNoSpace().test(v) ? undefined : 'Mobile number is not valid',
						}}
						render={({ field: { onChange, value } }) => (
							<Box marginBottom="m">
								<AnimatedInput
									label="Phone number"
									value={value}
									onChangeText={onChange}
									placeholder="10-digit mobile number"
									keyboardType="number-pad"
									isRequired
									hasError={!!errors.phone_number}
									errorMessage={errors.phone_number?.message}
								/>
							</Box>
						)}
					/>

					<Controller
						control={control}
						name="user_name"
						render={({ field: { onChange, value } }) => (
							<Box marginBottom="m">
								<AnimatedInput
									label="Full name"
									value={value}
									onChangeText={onChange}
									placeholder="Contact name (optional)"
								/>
							</Box>
						)}
					/>

					<Controller
						control={control}
						name="email"
						rules={{
							validate: (v) => (!v || utils.emailRegex().test(v) ? undefined : 'Email is not valid'),
						}}
						render={({ field: { onChange, value } }) => (
							<Box marginBottom="m">
								<AnimatedInput
									label="Email"
									value={value}
									onChangeText={onChange}
									placeholder="Email (optional)"
									keyboardType="email-address"
									hasError={!!errors.email}
									errorMessage={errors.email?.message}
								/>
							</Box>
						)}
					/>

					<Controller
						control={control}
						name="gst"
						rules={{
							validate: (v) => (!v || utils.get().test(v) ? undefined : 'GST number is not valid'),
						}}
						render={({ field: { onChange, value } }) => (
							<Box marginBottom="m">
								<AnimatedInput
									label="GST number"
									value={value}
									onChangeText={onChange}
									placeholder="GST (optional)"
									hasError={!!errors.gst}
									errorMessage={errors.gst?.message}
								/>
							</Box>
						)}
					/>

					<Controller
						control={control}
						name="user_address"
						render={({ field: { onChange, value } }) => (
							<Box marginBottom="l">
								<AnimatedInput
									label="Business address"
									value={value}
									onChangeText={onChange}
									placeholder="Address (optional)"
									multiline
									height={80}
								/>
							</Box>
						)}
					/>

					<AnimatedButton
						label={isLoading ? 'Submitting...' : 'Submit lead'}
						onPress={handleSubmit(onSubmit)}
						disabled={isLoading}
					/>
				</Box>
			</KeyboardAwareScrollView>
		</Screen>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: 40,
	},
});
