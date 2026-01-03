export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  order_user: number;
  order_user_username?: string;
  order_product: number;
  order_product_name?: string;
  order_quantity: number;
  order_price: string;
  order_status: OrderStatus;
  order_date?: string | null;
  order_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreate {
  order_user: number;
  order_product: number;
  order_quantity: number;
  order_price: string;
  order_status?: OrderStatus;
  order_date?: string | null;
  order_notes?: string | null;
}

export interface OrderUpdate {
  order_user?: number;
  order_product?: number;
  order_quantity?: number;
  order_price?: string;
  order_status?: OrderStatus;
  order_date?: string | null;
  order_notes?: string | null;
}


