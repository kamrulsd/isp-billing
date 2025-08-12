import apiClient from './api-client';
import { 
  PaginatedResponse, 
  PackageList, 
  PackageDetail, 
  CustomerList, 
  CustomerDetail, 
  PaymentList, 
  PaymentDetail,
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  Me,
  UserList,
  UserDetail,
  UserRegistration
} from './types';

// Auth Services
export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/users/login', credentials);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.post('/users/login/refresh', { refresh_token: refreshToken });
    return response.data;
  },

  getMe: async (): Promise<Me> => {
    const response = await apiClient.get('/users/me');
    return response.data;
  },
  getCurrentUser: async (): Promise<Me> => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : {phone: '', email: '', first_name: '', last_name: '', gender: 'UNKNOWN', image: '', kind: 'CUSTOMER'};
  },
  getCurrentUserSync: (): Me => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : {phone: '', email: '', first_name: '', last_name: '', gender: 'UNKNOWN', image: '', kind: 'CUSTOMER'};
  },
  hasPermission: (allowedRoles: string[]): boolean => {
    const user = authService.getCurrentUserSync();
    return allowedRoles.includes(user.kind || 'CUSTOMER');
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

// User Services
export const userService = {
  getUsers: async (page = 1, pageSize = 10): Promise<PaginatedResponse<UserList>> => {
    const response = await apiClient.get('/users', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getUser: async (uid: string): Promise<UserDetail> => {
    const response = await apiClient.get(`/users/${uid}`);
    return response.data;
  },

  createUser: async (userData: Partial<UserList>): Promise<UserList> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  updateUser: async (uid: string, userData: Partial<UserDetail>): Promise<UserDetail> => {
    const response = await apiClient.put(`/users/${uid}`, userData);
    return response.data;
  },

  deleteUser: async (uid: string): Promise<void> => {
    await apiClient.delete(`/users/${uid}`);
  },

  register: async (userData: UserRegistration): Promise<UserRegistration> => {
    const response = await apiClient.post('/users/register', userData);
    return response.data;
  },

  updateMe: async (userData: Partial<Me>): Promise<Me> => {
    const response = await apiClient.put('/users/me', userData);
    return response.data;
  }
};

// Package Services
export const packageService = {
  getPackages: async (page = 1, pageSize = 10): Promise<PaginatedResponse<PackageList>> => {
    const response = await apiClient.get('/packages', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  getPackage: async (uid: string): Promise<PackageDetail> => {
    const response = await apiClient.get(`/packages/${uid}`);
    return response.data;
  },

  createPackage: async (packageData: Partial<PackageList>): Promise<PackageList> => {
    const response = await apiClient.post('/packages', packageData);
    return response.data;
  },

  updatePackage: async (uid: string, packageData: Partial<PackageDetail>): Promise<PackageDetail> => {
    const response = await apiClient.put(`/packages/${uid}`, packageData);
    return response.data;
  },

  deletePackage: async (uid: string): Promise<void> => {
    await apiClient.delete(`/packages/${uid}`);
  },

  getPackageCustomers: async (uid: string, page = 1, pageSize = 10): Promise<PaginatedResponse<CustomerList>> => {
    const response = await apiClient.get(`/packages/${uid}/customers`, {
      params: { page, page_size: pageSize }
    });
    return response.data;
  }
};

// Customer Services
export const customerService = {
  getCustomers: async (
    page = 1, 
    pageSize = 10, 
    filters?: {
      name?: string;
      user_id?: number;
      phone?: string;
      username?: string;
      package_id?: number;
      is_active?: boolean;
    }
  ): Promise<PaginatedResponse<CustomerList>> => {
    const params: Record<string, string | number | boolean> = { page, page_size: pageSize };
    
    // Add filters if provided
    if (filters) {
      if (filters.name) params.name = filters.name;
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.phone) params.phone = filters.phone;
      if (filters.username) params.username = filters.username;
      if (filters.package_id) params.package_id = filters.package_id;
      if (filters.is_active !== undefined) params.is_active = filters.is_active;
    }
    
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  getCustomer: async (uid: string): Promise<CustomerDetail> => {
    const response = await apiClient.get(`/customers/${uid}`);
    return response.data;
  },

  createCustomer: async (customerData: Partial<CustomerList>): Promise<CustomerList> => {
    const response = await apiClient.post('/customers', customerData);
    return response.data;
  },

  updateCustomer: async (uid: string, customerData: Partial<CustomerDetail>): Promise<CustomerDetail> => {
    const response = await apiClient.put(`/customers/${uid}`, customerData);
    return response.data;
  },

  deleteCustomer: async (uid: string): Promise<void> => {
    await apiClient.delete(`/customers/${uid}`);
  },

  getCustomerPayments: async (uid: string, page = 1, pageSize = 10): Promise<PaginatedResponse<PaymentList>> => {
    const response = await apiClient.get(`/customers/${uid}/payments`, {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  createCustomerPayment: async (uid: string, paymentData: Partial<PaymentList>): Promise<PaymentList> => {
    const response = await apiClient.post(`/customers/${uid}/payments`, paymentData);
    return response.data;
  },

  generateBills: async (month?: string): Promise<void> => {
    const params = month ? { month } : {};
    await apiClient.post('/customers/bills/generate', null, { params });
  },

  toggleCustomerStatus: async (username: string, isActive: boolean): Promise<{ message: string }> => {
    const response = await apiClient.post('/customers/status/toggle', {
      username,
      is_active: isActive
    });
    return response.data;
  }
};

// Payment Services
export const paymentService = {
  getPayments: async (
    page = 1, 
    pageSize = 10, 
    filters?: {
      customer_name?: string;
      customer_phone?: string;
      collected_by?: string;
      month?: string;
        paid?: boolean;
      }
    ): Promise<PaginatedResponse<PaymentList>> => {
      const params: Record<string, string | number | boolean> = { page, page_size: pageSize };
    
      // Add filters if provided
      if (filters) {
        if (filters.customer_name) params.customer_name = filters.customer_name;
        if (filters.customer_phone) params.customer_phone = filters.customer_phone;
        if (filters.collected_by) params.collected_by = filters.collected_by;
        if (filters.month) params.month = filters.month;
        if (typeof filters.paid === 'boolean') params.paid = filters.paid;
    }
    
    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  getPayment: async (uid: string): Promise<PaymentDetail> => {
    const response = await apiClient.get(`/payments/${uid}`);
    return response.data;
  },

  createPayment: async (paymentData: Partial<PaymentList>): Promise<PaymentList> => {
    const response = await apiClient.post('/payments', paymentData);
    return response.data;
  },

  updatePayment: async (uid: string, paymentData: Partial<PaymentDetail>): Promise<PaymentDetail> => {
    const response = await apiClient.put(`/payments/${uid}`, paymentData);
    return response.data;
  },

  deletePayment: async (uid: string): Promise<void> => {
    await apiClient.delete(`/payments/${uid}`);
  }
};
