export interface CartItem {
	id: number;
	cart_user: number;
	cart_user_username: string;
	cart_product: string;
	cart_quantity: number;
	cart_status: boolean;
	product_image?: string | null;
	cart_product_name?: string;
	cart_product_price?: number;
	cart_product_image?: string | null;
	created_at: string;
	updated_at: string;
}

export interface AddToCartApiParams {
	cart_user: number;
	cart_product: string;
	cart_quantity?: number;
	cart_status?: boolean;
}

export interface UpdateCartItemApiParams {
	cart_quantity?: number;
	cart_status?: boolean;
}

export interface CartListApiResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: CartItem[];
}

export interface CartApiResponse {
	id: number;
	cart_user: number;
	cart_user_username: string;
	cart_product: string;
	cart_quantity: number;
	cart_status: boolean;
	created_at: string;
	updated_at: string;
}

export interface ClearCartApiParams {
	user_id: number;
}

export interface ClearCartApiResponse {
	message: string;
}
