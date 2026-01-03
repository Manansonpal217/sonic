import { Http } from '../core/Http';
import { Result } from '../core/Result';

export interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  category_image?: string;
  category_status: boolean;
  display_order: number;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

export class CategoryApi {
  private http: Http;

  constructor(http: Http) {
    this.http = http;
  }

  async getCategories(params?: {
    category_status?: boolean;
    search?: string;
    page?: number;
  }): Promise<Result<CategoryResponse>> {
    return this.http.get<CategoryResponse>('/categories/', params);
  }

  async getActiveCategories(): Promise<Result<Category[]>> {
    return this.http.get<Category[]>('/categories/active/');
  }

  async getCategory(id: number): Promise<Result<Category>> {
    return this.http.get<Category>(`/categories/${id}/`);
  }

  async getCategoryProducts(id: number): Promise<Result<any>> {
    return this.http.get<any>(`/categories/${id}/products/`);
  }
}


