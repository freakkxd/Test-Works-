import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Автоматически добавляем JWT токен к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  oldPrice?: string | null;
  brand: string;
  stock: number;
  rating: number;
  ratingCount: number;
  images: string[];
  specs: Record<string, string>;
  category: { id: string; name: string; slug: string };
  reviews?: Review[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; name: string | null };
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  customerName: string;
  customerPhone: string;
  address: string;
  comment: string | null;
  createdAt: string;
  items: Array<{ id: string; quantity: number; price: string; product: Product }>;
  payments: Array<{ id: string; status: string; confirmationUrl: string | null }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  inStock?: boolean;
  minRating?: number;
  sortBy?: string;
  sortOrder?: string;
}

export const productsApi = {
  getAll: (filters: ProductFilters) =>
    api.get<PaginatedResponse<Product>>('/products', { params: filters }),
  getOne: (id: string) => api.get<Product>(`/products/${id}`),
  getCategories: () => api.get<Category[]>('/products/categories'),
  getBrands: () => api.get<string[]>('/products/brands'),
  create: (data: Record<string, unknown>) => api.post<Product>('/products', data),
  update: (id: string, data: Record<string, unknown>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<{ user: User; token: string }>('/auth/register', { email, password, name }),
};

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'USER';
}

export const cartApi = {
  get: () => api.get<{ items: CartItem[]; total: number }>('/cart'),
  add: (productId: string, quantity: number) =>
    api.post('/cart', { productId, quantity }),
  update: (id: string, quantity: number) => api.put(`/cart/${id}`, { quantity }),
  remove: (id: string) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart'),
};

export const ordersApi = {
  create: (data: { customerName: string; customerPhone: string; address: string; comment?: string }) =>
    api.post<Order>('/orders', data),
  myOrders: () => api.get<Order[]>('/orders/my'),
  getAll: (page?: number) => api.get<PaginatedResponse<Order>>('/orders', { params: { page } }),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
};

export const paymentsApi = {
  create: (orderId: string) => api.post(`/payments/create/${orderId}`),
  simulate: (orderId: string) => api.post(`/payments/simulate/${orderId}`),
};

export const reviewsApi = {
  create: (productId: string, rating: number, comment?: string) =>
    api.post('/reviews', { productId, rating, comment }),
  getByProduct: (productId: string) => api.get<Review[]>(`/reviews/product/${productId}`),
};

export const demoApi = {
  reset: () => api.post('/admin/demo/reset'),
  health: () => api.get('/health'),
};
