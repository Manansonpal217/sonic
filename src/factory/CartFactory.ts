import { getHttp } from '../core/Http';
import { CART_LIST, CART_CLEAR } from '../api/EndPoint';
import {
	CartListApiResponse,
	CartApiResponse,
	AddToCartApiParams,
	UpdateCartItemApiParams,
	ClearCartApiParams,
	ClearCartApiResponse,
} from '../api/CartApi';
import { authStore } from '../stores/AuthStore';

class CartFactory {
	/**
	 * Get cart list for the logged-in user
	 */
	async getCartListApi(): Promise<{
		isSuccess: boolean;
		data?: CartListApiResponse;
		error?: string;
	}> {
		try {
			const user = authStore?.loginData?.user;
			if (!user) {
				return {
					isSuccess: false,
					error: 'User not logged in',
				};
			}

			// Get user ID from user object (check multiple possible field names)
			const userId = user?.id || user?.user_id || user?.pk || user?.userId;
			if (!userId) {
				console.error('User object:', user);
				console.error('Available user fields:', Object.keys(user || {}));
				return {
					isSuccess: false,
					error: 'User ID not found. Please check user object structure.',
				};
			}

			const http = getHttp();
			const url = `${CART_LIST()}?user_id=${userId}`;
			console.log('Fetching cart items for user ID:', userId);
			console.log('Cart API URL:', url);
			
			const result = await http.get<CartListApiResponse>(url);
			
			console.log('Cart API Response:', {
				isSuccess: result.isSuccess,
				hasData: !!result.data,
				error: result.error,
			});

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to fetch cart items',
			};
		}
	}

	/**
	 * Add item to cart
	 */
	async addToCartApi(params: AddToCartApiParams): Promise<{
		isSuccess: boolean;
		data?: CartApiResponse;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const result = await http.post<CartApiResponse>(CART_LIST(), params);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to add item to cart',
			};
		}
	}

	/**
	 * Update cart item (quantity, status, etc.)
	 */
	async updateCartItemApi(
		cartId: number,
		params: UpdateCartItemApiParams
	): Promise<{
		isSuccess: boolean;
		data?: CartApiResponse;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const result = await http.patch<CartApiResponse>(
				`${CART_LIST()}${cartId}/`,
				params
			);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to update cart item',
			};
		}
	}

	/**
	 * Delete cart item
	 */
	async deleteCartItemApi(cartId: number): Promise<{
		isSuccess: boolean;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const result = await http.delete(`${CART_LIST()}${cartId}/`);

			return {
				isSuccess: result.isSuccess,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to delete cart item',
			};
		}
	}

	/**
	 * Clear entire cart for user
	 */
	async clearCartApi(): Promise<{
		isSuccess: boolean;
		data?: ClearCartApiResponse;
		error?: string;
	}> {
		try {
			const user = authStore?.loginData?.user;
			if (!user) {
				return {
					isSuccess: false,
					error: 'User not logged in',
				};
			}

			// Get user ID from user object (check multiple possible field names)
			const userId = user?.id || user?.user_id || user?.pk || user?.userId;
			if (!userId) {
				console.error('User object:', user);
				console.error('Available user fields:', Object.keys(user || {}));
				return {
					isSuccess: false,
					error: 'User ID not found. Please check user object structure.',
				};
			}

			const params: ClearCartApiParams = {
				user_id: userId,
			};

			const http = getHttp();
			const result = await http.post<ClearCartApiResponse>(
				CART_CLEAR(),
				params
			);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to clear cart',
			};
		}
	}
}

export const cartFactory = new CartFactory();

