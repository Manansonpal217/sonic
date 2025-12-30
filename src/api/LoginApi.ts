export interface LoginApiParams {
	user_email: string;
	user_password: string;
}

export interface LoginApiResponse {
	token: string;
	message?: string;
	user?: any;
}


