const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
export const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || 'http://localhost:8000/media';

export const API_ENDPOINTS = {
  // Auth
  login: '/api/client-login',
  registration: '/api/client-registration',
  
  // Categories
  categories: '/api/categories/',
  category: (id: number) => `/api/categories/${id}/`,
  categoriesActive: '/api/categories/active/',
  categoryProducts: (id: number) => `/api/categories/${id}/products/`,
  categoriesSoftDelete: '/api/categories/soft_delete/',
  
  // Category Fields
  categoryFields: '/api/category-fields/',
  categoryField: (id: number) => `/api/category-fields/${id}/`,
  categoryFieldsSoftDelete: '/api/category-fields/soft_delete/',
  
  // Users
  users: '/api/users/',
  user: (id: number) => `/api/users/${id}/`,
  usersSoftDelete: '/api/users/soft_delete/',
  
  // Products
  products: '/api/products/',
  product: (id: number) => `/api/products/${id}/`,
  productChildren: (id: number) => `/api/products/${id}/children/`,
  productsSoftDelete: '/api/products/soft_delete/',
  productFieldValues: '/api/product-field-values/',
  productFieldValuesBulkCreate: '/api/product-field-values/bulk_create/',
  
  // Orders
  orders: '/api/orders/',
  order: (id: number) => `/api/orders/${id}/`,
  ordersSoftDelete: '/api/orders/soft_delete/',
  ordersCheckout: '/api/orders/checkout/',
  
  // Customize Orders
  customizeOrders: '/api/customize-orders/',
  customizeOrder: (id: number) => `/api/customize-orders/${id}/`,
  
  // Cart
  cart: '/api/cart/',
  cartItem: (id: number) => `/api/cart/${id}/`,
  cartClear: '/api/cart/clear_cart/',
  
  // Banners
  banners: '/api/banners/',
  banner: (id: number) => `/api/banners/${id}/`,
  bannersActive: '/api/banners/active/',
  
  // CMS
  cms: '/api/cms/',
  cmsBySlug: (slug: string) => `/api/cms/${slug}/`,
  cmsActive: '/api/cms/active/',
  
  // Notification Types
  notificationTypes: '/api/notification-types/',
  notificationType: (id: number) => `/api/notification-types/${id}/`,
  
  // Notifications
  notifications: '/api/notifications/',
  notification: (id: number) => `/api/notifications/${id}/`,
  notificationMarkRead: (id: number) => `/api/notifications/${id}/mark_read/`,
  notificationsMarkAllRead: '/api/notifications/mark_all_read/',
  notificationsSend: '/api/notifications/send_notification/',
  
  // Order Emails
  orderEmails: '/api/order-emails/',
  orderEmail: (id: number) => `/api/order-emails/${id}/`,
  
  // Sessions
  sessions: '/api/sessions/',
  session: (id: number) => `/api/sessions/${id}/`,
  sessionUpdateFcmToken: '/api/sessions/update_fcm_token/',
} as const;

export const getFullUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) return endpoint;
  if (endpoint.startsWith('/api')) {
    const base = API_BASE_URL.replace('/api', '');
    return `${base}${endpoint}`;
  }
  return `${API_BASE_URL}${endpoint}`;
};


