import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Controller, useForm } from 'react-hook-form';
import { Box, Text, Screen, CommonHeader, Pressable, StatusBarType, Image, Logo } from '../components';
import { goBack, navigate, Route } from '../navigation/AppNavigation';
import { showErrorMessage, getHttp } from '../core';
import { PRODUCT_LEADS, BASE_URL, MEDIA_BASE_URL } from '../api/EndPoint';
import { AnimatedInput } from '../components/auth/AnimatedInput';
import { AnimatedButton } from '../components/auth/AnimatedButton';
import { fonts } from '../style';
import { utils } from '../Utils/Utils';

interface ProductVariantItem {
	id: number;
	variant_value_1: string;
	variant_value_2?: string | null;
	display_values?: Record<string, string>;
}

interface LeadProduct {
	id: number;
	product_name: string;
	product_image?: string | null;
	variants?: ProductVariantItem[];
	variant_dimension_labels?: string[];
	dimension_1_options?: string[];
	dimension_2_options?: string[];
}

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
	quantity: number;
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
	const [product, setProduct] = useState<LeadProduct | null>(null);
	const [productLoading, setProductLoading] = useState(true);
	const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
	const [selectedDim1Value, setSelectedDim1Value] = useState<string | null>(null);
	const [selectedDim2Value, setSelectedDim2Value] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		setValue,
		formState: { errors },
	} = useForm<LeadFormData>({
		defaultValues: {
			company_name: '',
			phone_number: '',
			quantity: 1,
			user_name: '',
			email: '',
			gst: '',
			user_address: '',
		},
	});

	// Fetch product details for image and variants
	useEffect(() => {
		if (!productId) {
			setProductLoading(false);
			return;
		}
		let cancelled = false;
		const loadProduct = async () => {
			try {
				setProductLoading(true);
				const http = getHttp();
				const productUrl = `${BASE_URL}/products/${productId}/`;
				const result = await http.get<any>(productUrl);
				if (cancelled) return;
				if (result.isSuccess && result.data) {
					const p = result.data;
					setProduct(p);
					if (p.variants?.length) {
						const first = p.variants[0];
						setSelectedDim1Value(first?.variant_value_1 ?? null);
						setSelectedDim2Value(first?.variant_value_2 ?? null);
						setSelectedVariantId(first?.id ?? null);
					} else {
						setSelectedDim1Value(null);
						setSelectedDim2Value(null);
						setSelectedVariantId(null);
					}
				} else {
					setProduct(null);
				}
			} catch {
				if (!cancelled) setProduct(null);
			} finally {
				if (!cancelled) setProductLoading(false);
			}
		};
		loadProduct();
		return () => { cancelled = true; };
	}, [productId]);

	// Resolve selected variant from dimension selections
	const resolvedVariantId = useMemo(() => {
		if (!product?.variants?.length) return null;
		if (product.variants.length === 1 && !selectedDim1Value) return product.variants[0]?.id ?? null;
		const hasTwoDims = product.variants.some((v: ProductVariantItem) => v.variant_value_2 != null && v.variant_value_2 !== '');
		if (hasTwoDims && selectedDim1Value != null && selectedDim2Value != null) {
			const match = product.variants.find(
				(v: ProductVariantItem) =>
					v.variant_value_1 === selectedDim1Value &&
					(v.variant_value_2 === selectedDim2Value || (v.variant_value_2 == null && selectedDim2Value === ''))
			);
			return match?.id ?? null;
		}
		const match = product.variants.find((v: ProductVariantItem) => v.variant_value_1 === selectedDim1Value);
		return match?.id ?? null;
	}, [product?.variants, selectedDim1Value, selectedDim2Value]);

	// Pre-fill from last submitted company
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
			const payload: Record<string, unknown> = {
				product: productId,
				company_name: data.company_name.trim(),
				phone_number: data.phone_number.trim(),
				quantity: data.quantity || 1,
				user_name: data.user_name?.trim() || undefined,
				email: data.email?.trim() || undefined,
				gst: data.gst?.trim() || undefined,
				address: data.user_address?.trim() || undefined,
			};
			if (resolvedVariantId != null) {
				payload.product_variant = resolvedVariantId;
			}
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
				<Box flex={1} padding="m" backgroundColor="gray5">
					<Box
						backgroundColor="white"
						borderRadius="lg"
						padding="xl"
						alignItems="center"
						marginBottom="m"
						style={{
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.08,
							shadowRadius: 8,
							elevation: 4,
						}}
					>
						<Box
							width={80}
							height={80}
							borderRadius="full"
							backgroundColor="red3"
							justifyContent="center"
							alignItems="center"
							marginBottom="m"
						>
							<Text fontSize={40} color="white" fontFamily={fonts.bold}>✓</Text>
						</Box>
						<Text fontSize={22} fontFamily={fonts.bold} marginBottom="s" textAlign="center">
							Lead Submitted Successfully!
						</Text>
						<Text fontSize={16} color="gray" textAlign="center" marginBottom="m">
							{productName
								? `Your inquiry for ${productName} has been received.`
								: 'Your product inquiry has been received.'}
						</Text>
						{productName && (
							<Box
								backgroundColor="gray5"
								borderRadius="m"
								padding="m"
								width="100%"
								marginBottom="m"
							>
								<Box flexDirection="row" justifyContent="space-between">
									<Text variant="body" color="gray">Product:</Text>
									<Text variant="body" fontFamily={fonts.semiBold} numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
										{productName}
									</Text>
								</Box>
							</Box>
						)}
					</Box>

					<Box
						backgroundColor="white"
						borderRadius="lg"
						padding="m"
						marginBottom="m"
						style={{
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.08,
							shadowRadius: 8,
							elevation: 4,
						}}
					>
						<Text fontSize={18} fontFamily={fonts.bold} marginBottom="m">What&apos;s Next?</Text>
						<Text fontSize={14} color="gray" marginBottom="s">
							• Our team will review your inquiry shortly
						</Text>
						<Text fontSize={14} color="gray" marginBottom="s">
							• We&apos;ll contact you at the provided phone number
						</Text>
						<Text fontSize={14} color="gray">
							• You can scan another product to submit more leads
						</Text>
					</Box>

					<Box marginTop="m" paddingHorizontal="s">
						<Pressable onPress={() => navigate({ screenName: Route.ScanQR })}>
							<Box
								backgroundColor="red3"
								borderRadius={12}
								paddingVertical="m"
								paddingHorizontal="m"
								alignItems="center"
								justifyContent="center"
								marginBottom="m"
								style={{
									shadowColor: '#842B25',
									shadowOffset: { width: 0, height: 4 },
									shadowOpacity: 0.3,
									shadowRadius: 8,
									elevation: 5,
								}}
							>
								<Text fontSize={16} fontFamily={fonts.bold} color="white" letterSpacing={0.5}>
									Scan another product
								</Text>
							</Box>
						</Pressable>
						<Pressable onPress={goBack}>
							<Box
								backgroundColor="white"
								borderRadius={12}
								paddingVertical="m"
								paddingHorizontal="m"
								alignItems="center"
								justifyContent="center"
								style={{
									borderWidth: 2,
									borderColor: '#842B25',
									shadowColor: '#000',
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.1,
									shadowRadius: 4,
									elevation: 3,
								}}
							>
								<Text fontSize={16} fontFamily={fonts.bold} color="red3" letterSpacing={0.5}>
									Done
								</Text>
							</Box>
						</Pressable>
					</Box>
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
					{/* Product card: image + name + variant selector */}
					{productLoading ? (
						<Box paddingVertical="xl" alignItems="center">
							<ActivityIndicator size="large" color="#842B25" />
						</Box>
					) : product ? (
						<Box
							backgroundColor="white"
							borderRadius={12}
							padding="m"
							marginBottom="lg"
							style={{
								borderWidth: 1,
								borderColor: '#E8E8E8',
								shadowColor: '#000',
								shadowOffset: { width: 0, height: 1 },
								shadowOpacity: 0.06,
								shadowRadius: 4,
								elevation: 2,
							}}
						>
							<Box flexDirection="row" alignItems="center" marginBottom={product.variants?.length ? 'm' : undefined}>
								<Box
									width={80}
									height={80}
									borderRadius={8}
									backgroundColor="gray5"
									overflow="hidden"
									marginEnd="m"
									justifyContent="center"
									alignItems="center"
								>
									{product.product_image ? (
										<Image
											source={{ uri: product.product_image.startsWith('http') ? product.product_image : `${MEDIA_BASE_URL}${product.product_image.startsWith('/') ? '' : '/'}${product.product_image}` }}
											style={{ width: 80, height: 80 }}
											width={80}
											height={80}
										/>
									) : (
										<Logo width={44} height={40} style={{ opacity: 0.4 }} />
									)}
								</Box>
								<Box flex={1}>
									<Text fontSize={16} fontFamily={fonts.bold} color="black" numberOfLines={2}>
										{product.product_name}
									</Text>
								</Box>
							</Box>
							{/* Variant selection */}
							{product.variants && product.variants.length > 0 && (() => {
								const dim1Options = product.dimension_1_options ?? [...new Set(product.variants.map((v: ProductVariantItem) => v.variant_value_1))];
								const dim2Options = product.dimension_2_options ?? [...new Set(product.variants.map((v: ProductVariantItem) => v.variant_value_2).filter(Boolean))];
								const label1 = product.variant_dimension_labels?.[0] ?? 'Size';
								const label2 = product.variant_dimension_labels?.[1] ?? 'Karat';
								return (
									<Box marginTop="s">
										<Text fontSize={14} fontFamily={fonts.semiBold} color="black" marginBottom="s">
											{label1}
										</Text>
										<Box flexDirection="row" flexWrap="wrap" marginBottom={dim2Options.length > 0 ? 'm' : undefined}>
											{dim1Options.map((opt: string) => {
												const isSelected = selectedDim1Value === opt;
												return (
													<Pressable
														key={opt}
														onPress={() => setSelectedDim1Value(opt)}
														style={{
															marginRight: 8,
															marginBottom: 8,
															paddingVertical: 8,
															paddingHorizontal: 12,
															borderRadius: 8,
															borderWidth: 1,
															borderColor: isSelected ? '#842B25' : '#E0E0E0',
															backgroundColor: isSelected ? 'rgba(132,43,37,0.08)' : 'white',
														}}
													>
														<Text fontSize={13} fontFamily={isSelected ? fonts.semiBold : fonts.regular} color={isSelected ? '#842B25' : 'black'}>
															{opt}
														</Text>
													</Pressable>
												);
											})}
										</Box>
										{dim2Options.length > 0 && (
											<>
												<Text fontSize={14} fontFamily={fonts.semiBold} color="black" marginBottom="s">
													{label2}
												</Text>
												<Box flexDirection="row" flexWrap="wrap">
													{dim2Options.map((opt: string) => {
														const isSelected = selectedDim2Value === opt;
														return (
															<Pressable
																key={opt}
																onPress={() => setSelectedDim2Value(opt)}
																style={{
																	marginRight: 8,
																	marginBottom: 8,
																	paddingVertical: 8,
																	paddingHorizontal: 12,
																	borderRadius: 8,
																	borderWidth: 1,
																	borderColor: isSelected ? '#842B25' : '#E0E0E0',
																	backgroundColor: isSelected ? 'rgba(132,43,37,0.08)' : 'white',
																}}
															>
																<Text fontSize={13} fontFamily={isSelected ? fonts.semiBold : fonts.regular} color={isSelected ? '#842B25' : 'black'}>
																	{opt}
																</Text>
															</Pressable>
														);
													})}
												</Box>
											</>
										)}
									</Box>
								);
							})()}
						</Box>
					) : null}

					{/* Header Card */}
					<Box
						backgroundColor="gray5"
						borderRadius={12}
						padding="m"
						marginBottom="lg"
						style={{ borderLeftWidth: 4, borderLeftColor: '#842B25' }}
					>
						<Text fontSize={14} fontFamily={fonts.regular} color="gray" textAlign="center">
							Company name and phone number are required. Other fields are optional.
						</Text>
					</Box>

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

					{/* Quantity Selector */}
					<Controller
						control={control}
						name="quantity"
						rules={{ required: true, min: 1, max: 999 }}
						render={({ field: { value, onChange } }) => (
							<Box marginBottom="m">
								<Text fontSize={14} fontFamily={fonts.medium} color="black" marginBottom="s">
									Quantity
								</Text>
								<Box
									flexDirection="row"
									alignItems="center"
									backgroundColor="gray5"
									borderRadius={12}
									borderWidth={2}
									borderColor="gray5"
									paddingHorizontal="m"
									paddingVertical="s"
								>
									<Pressable
										onPress={() => onChange(Math.max(1, (value || 1) - 1))}
										style={{ padding: 8, marginRight: 8 }}
									>
										<Text fontSize={24} fontFamily={fonts.bold} color="red3">−</Text>
									</Pressable>
									<Text fontSize={18} fontFamily={fonts.bold} color="black" style={{ minWidth: 40, textAlign: 'center' }}>
										{value || 1}
									</Text>
									<Pressable
										onPress={() => onChange(Math.min(999, (value || 1) + 1))}
										style={{ padding: 8, marginLeft: 8 }}
									>
										<Text fontSize={24} fontFamily={fonts.bold} color="red3">+</Text>
									</Pressable>
								</Box>
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
							<Box marginBottom="lg">
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

					{/* Submit Section */}
					<Box marginTop="lg" marginBottom="m">
						<AnimatedButton
							title={isLoading ? 'Submitting...' : 'Submit lead'}
							onPress={handleSubmit(onSubmit)}
							disabled={isLoading}
						/>
					</Box>
				</Box>
			</KeyboardAwareScrollView>
		</Screen>
	);
};

const styles = StyleSheet.create({
	scrollContent: {
		paddingBottom: 48,
		paddingTop: 8,
	},
});
