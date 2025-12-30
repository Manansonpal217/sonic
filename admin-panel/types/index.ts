export * from './api';
export * from './user';
export * from './product';
export * from './order';

// Additional types will be added as modules are implemented
export interface CustomizeOrder {
  id: number;
  customize_user: number;
  customize_user_username?: string;
  order_image?: string | null;
  order_audio?: string | null;
  order_date?: string | null;
  order_description?: string | null;
  order_status: 'pending' | 'reviewing' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  cart_user: number;
  cart_user_username?: string;
  cart_product: string;
  cart_quantity: number;
  cart_status: boolean;
  product_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Banner {
  id: number;
  banner_title: string;
  banner_image?: string | null;
  banner_product_id?: number | null;
  banner_product_name?: string | null;
  banner_status: boolean;
  banner_order: number;
  created_at: string;
  updated_at: string;
}

export interface CMSPage {
  id: number;
  cms_title: string;
  cms_slug: string;
  cms_content?: string | null;
  cms_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationType {
  notif_id: number;
  notif_name: string;
  notif_status: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Notification {
  id: number;
  notification_user: number;
  notification_user_username?: string;
  notification_type: number;
  notification_type_name?: string;
  notification_title: string;
  notification_message?: string | null;
  notification_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderEmail {
  mail_id: number;
  mail_from: string;
  mail_to: string;
  mail_subject: string;
  mail_content: string;
  mail_user?: string | null;
  mail_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  session_user: number;
  session_user_username?: string;
  session_key: string;
  fcm_token?: string | null;
  device_type?: string | null;
  created_at: string;
  updated_at: string;
  expire_date: string;
}

