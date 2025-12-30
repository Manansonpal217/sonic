export interface LoginApiParams {
	user_email: string;
	user_password: string;
	remember_me?: boolean;
}

export interface LoginApiResponse {
	token: string;
	message?: string;
	user?: any;
}


