import { getHttp } from '../core/Http';
import { LOGIN, REGISTRATION } from '../api/EndPoint';
import { LoginApiParams, LoginApiResponse } from '../api/LoginApi';
import { RegistrationApiParams, RegistrationApiResponse } from '../api/RegistrationApi';
import { authStore } from '../stores/AuthStore';

class AuthFactory {
	async loginApi(email: string, password: string, rememberMe: boolean = false) {
		const params: LoginApiParams = {
			user_email: email,
			user_password: password,
			remember_me: rememberMe,
		};

		const http = getHttp();
		const result = await http.post<LoginApiResponse>(LOGIN(), params);

		if (result.isSuccess && result.data?.token) {
			await authStore.setLoginData(
				{
					token: result.data.token,
					user: result.data.user,
				},
				rememberMe ? { email, password } : null
			);
		}

		return result;
	}

	async registrationApi(params: RegistrationApiParams) {
		const http = getHttp();
		const result = await http.post<RegistrationApiResponse>(REGISTRATION(), params);
		return result;
	}
}

export const authFactory = new AuthFactory();


