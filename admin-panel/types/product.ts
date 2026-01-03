export interface Product {
  id: number;
  product_name: string;
  product_description?: string | null;
  product_price: string;
  product_image?: string | null;
  product_form_response?: string | null;
  product_category?: number | null;
  product_category_name?: string | null;
  product_is_parent: boolean;
  product_parent_id?: number | null;
  product_parent_name?: string | null;
  product_status: boolean;
  created_at: string;
  updated_at: string;
  child_products?: Product[];
}

export interface ProductCreate {
  product_name: string;
  product_description?: string | null;
  product_price: string;
  product_image?: File | null;
  product_form_response?: string | null;
  product_category?: number | null;
  product_is_parent?: boolean;
  product_parent_id?: number | null;
  product_status?: boolean;
}

export interface ProductUpdate {
  product_name?: string;
  product_description?: string | null;
  product_price?: string;
  product_image?: File | null;
  product_form_response?: string | null;
  product_category?: number | null;
  product_is_parent?: boolean;
  product_parent_id?: number | null;
  product_status?: boolean;
}


