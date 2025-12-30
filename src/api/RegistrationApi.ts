export interface RegistrationApiParams {
	user_name: string;
	user_email: string;
	user_phone_number: string;
	user_company_name: string;
	user_gst: string;
	user_address: string;
	user_password: string;
	confirm_password: string;
}

export interface RegistrationApiResponse {
	message?: string;
	user?: any;
}


