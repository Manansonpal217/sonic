import { Http, getHttp } from '../core';
import { Result } from '../core/Result';

export interface OrderItem {
  id: number;
  product: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: number;
  order_user: number;
  order_user_username: string;
  order_total_price: string;
  order_status: string;
  order_date: string;
  order_notes?: string;
  order_items: OrderItem[];
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrderResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Order[];
}

export interface CheckoutRequest {
  user_id: number;
  order_notes?: string;
  cart_item_ids?: number[]; // Optional: for product-wise checkout
}

export class OrderApi {
  private http: Http;

  constructor(http: Http) {
    this.http = http;
  }

  async getOrders(params?: {
    user_id?: number;
    order_status?: string;
    page?: number;
  }): Promise<Result<OrderResponse>> {
    // Convert params to query string format for axios
    const queryParams = params ? {
      params: {
        ...(params.user_id && { user_id: params.user_id }),
        ...(params.order_status && { order_status: params.order_status }),
        ...(params.page && { page: params.page }),
      }
    } : undefined;
    
    console.log('OrderApi.getOrders - params:', params, 'queryParams:', queryParams);
    return this.http.get<OrderResponse>('/orders/', queryParams);
  }

  async getOrder(id: number): Promise<Result<Order>> {
    return this.http.get<Order>(`/orders/${id}/`);
  }

  async checkout(data: CheckoutRequest): Promise<Result<Order>> {
    return this.http.post<Order>('/orders/checkout/', data);
  }
}

// Note: Use orderFactory from '../factory/OrderFactory' instead of creating an instance here
// This avoids initialization issues when HTTP client is not yet ready

