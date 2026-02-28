import { getHttp } from '../core/Http';
import { LOGIN, REGISTRATION, SEND_OTP, VERIFY_OTP, DELETE_ACCOUNT } from '../api/EndPoint';
import { LoginApiParams, LoginApiResponse } from '../api/LoginApi';
import { RegistrationApiParams, RegistrationApiResponse } from '../api/RegistrationApi';
import { SendOTPApiParams, SendOTPApiResponse, VerifyOTPApiParams, VerifyOTPApiResponse } from '../api/OTPApi';
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

	async sendOTP(phoneNumber: string) {
		const params: SendOTPApiParams = {
			phone_number: phoneNumber,
		};

		const http = getHttp();
		const result = await http.post<SendOTPApiResponse>(SEND_OTP(), params);
		return result;
	}

	async verifyOTP(phoneNumber: string, otpCode: string) {
		const params: VerifyOTPApiParams = {
			phone_number: phoneNumber,
			otp_code: otpCode,
		};

		const http = getHttp();
		const result = await http.post<VerifyOTPApiResponse>(VERIFY_OTP(), params);

		if (result.isSuccess && result.data?.token) {
			await authStore.setLoginData({
				token: result.data.token,
				user: result.data.user,
			}, null);
		}

		return result;
	}

	async deleteAccountApi() {
		const http = getHttp();
		const result = await http.post<{ message: string }>(DELETE_ACCOUNT());
		return result;
	}
}

export const authFactory = new AuthFactory();


