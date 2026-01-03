import { getHttp } from '../core/Http';
import {
	OrderResponse,
	Order,
	CheckoutRequest,
} from '../api/OrderApi';
import { OrderApi } from '../api/OrderApi';

class OrderFactory {
	/**
	 * Get orders list
	 */
	async getOrdersApi(params?: {
		user_id?: number;
		order_status?: string;
		page?: number;
	}): Promise<{
		isSuccess: boolean;
		data?: OrderResponse;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const orderApi = new OrderApi(http);
			const result = await orderApi.getOrders(params);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to fetch orders',
			};
		}
	}

	/**
	 * Get single order
	 */
	async getOrderApi(id: number): Promise<{
		isSuccess: boolean;
		data?: Order;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const orderApi = new OrderApi(http);
			const result = await orderApi.getOrder(id);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to fetch order',
			};
		}
	}

	/**
	 * Checkout (create order from cart)
	 */
	async checkoutApi(data: CheckoutRequest): Promise<{
		isSuccess: boolean;
		data?: Order;
		error?: string;
	}> {
		try {
			const http = getHttp();
			const orderApi = new OrderApi(http);
			const result = await orderApi.checkout(data);

			return {
				isSuccess: result.isSuccess,
				data: result.data,
				error: result.error,
			};
		} catch (error: any) {
			return {
				isSuccess: false,
				error: error?.message || 'Failed to checkout',
			};
		}
	}
}

export const orderFactory = new OrderFactory();

