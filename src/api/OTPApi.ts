export interface SendOTPApiParams {
	phone_number: string;
}

export interface SendOTPApiResponse {
	message: string;
	phone_number: string;
	expires_at: string;
	otp_code?: string; // Only in mock/dev mode
}

export interface VerifyOTPApiParams {
	phone_number: string;
	otp_code: string;
	fcm_token?: string;
	latitude?: number;
	longitude?: number;
	address?: string;
}

export interface VerifyOTPApiResponse {
	message: string;
	token: string;
	user: any;
}
