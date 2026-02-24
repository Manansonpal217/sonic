export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: number;
  order: number;
  product: number;
  product_variant?: number | null;
  product_name: string;
  product_image?: string | null;
  product_variant_display?: Record<string, unknown> | null;
  quantity: number;
  price: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_user: number;
  order_user_username?: string;
  order_product: number;
  order_product_name?: string;
  order_quantity: number;
  order_price: string;
  order_total_price?: string | null;
  order_status: OrderStatus;
  order_date?: string | null;
  order_notes?: string | null;
  order_items?: OrderItem[];
  items_count?: number;
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


