export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  company_name?: string | null;
  gst?: string | null;
  address?: string | null;
  user_status: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined?: string;
  last_login?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
  company_name?: string | null;
  gst?: string | null;
  address?: string | null;
  user_status?: boolean;
  is_active?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
}


