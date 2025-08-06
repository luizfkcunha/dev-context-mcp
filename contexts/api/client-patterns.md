# Padrões de Cliente API

## Cliente HTTP Base

### 1. Axios Cliente Configurado
```javascript
// lib/apiClient.js
import axios from 'axios';
import { logger } from './logger';

// Configuração base
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Adicionar token de autenticação
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('token') 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Adicionar correlation ID
    config.headers['X-Correlation-ID'] = crypto.randomUUID();

    // Log da requisição
    logger.debug('API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error) => {
    logger.error('API Request Error', { error: error.message });
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    logger.debug('API Response', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const { response } = error;
    
    logger.error('API Response Error', {
      status: response?.status,
      url: error.config?.url,
      message: error.message,
      data: response?.data,
    });

    // Tratamento de erros específicos
    if (response?.status === 401) {
      // Token expirado ou inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
```

### 2. Cliente com Retry e Timeout
```javascript
// lib/enhancedApiClient.js
import axios from 'axios';
import axiosRetry from 'axios-retry';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
  timeout: 10000,
});

// Configurar retry
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000; // 1s, 2s, 3s
  },
  retryCondition: (error) => {
    // Retry em erros de rede ou 5xx
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           (error.response?.status >= 500);
  },
});

// Rate limiting
const rateLimit = new Map();
const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW = 60000; // 1 minuto

apiClient.interceptors.request.use((config) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Limpar requests antigas
  for (const [timestamp] of rateLimit) {
    if (timestamp < windowStart) {
      rateLimit.delete(timestamp);
    }
  }
  
  // Verificar se excedeu o limite
  if (rateLimit.size >= RATE_LIMIT_REQUESTS) {
    throw new Error('Rate limit exceeded');
  }
  
  rateLimit.set(now, true);
  return config;
});

export default apiClient;
```

## Padrões de Service Layer

### 1. Service Base Class
```javascript
// services/BaseService.js
import apiClient from '../lib/apiClient';

export class BaseService {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async get(id, options = {}) {
    try {
      const response = await apiClient.get(`${this.basePath}/${id}`, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async getAll(params = {}, options = {}) {
    try {
      const response = await apiClient.get(this.basePath, { 
        params, 
        ...options 
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async create(data, options = {}) {
    try {
      const response = await apiClient.post(this.basePath, data, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async update(id, data, options = {}) {
    try {
      const response = await apiClient.put(`${this.basePath}/${id}`, data, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async delete(id, options = {}) {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`, options);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  handleError(error) {
    if (error.response) {
      // Erro da resposta do servidor
      return {
        status: error.response.status,
        message: error.response.data?.message || error.message,
        details: error.response.data,
      };
    } else if (error.request) {
      // Erro de rede
      return {
        status: 0,
        message: 'Erro de conexão com o servidor',
        details: null,
      };
    } else {
      // Outro erro
      return {
        status: 0,
        message: error.message,
        details: null,
      };
    }
  }
}
```

### 2. Service Específico
```javascript
// services/userService.js
import { BaseService } from './BaseService';

class UserService extends BaseService {
  constructor() {
    super('/users');
  }

  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      
      // Salvar token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout');
      localStorage.removeItem('token');
      return { data: true, error: null };
    } catch (error) {
      // Remover token mesmo em caso de erro
      localStorage.removeItem('token');
      return { data: true, error: this.handleError(error) };
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiClient.get('/auth/me');
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async updateProfile(data) {
    try {
      const response = await apiClient.put('/auth/profile', data);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async changePassword(passwordData) {
    try {
      const response = await apiClient.put('/auth/password', passwordData);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }

  async searchUsers(query, filters = {}) {
    try {
      const response = await apiClient.get('/users/search', {
        params: { q: query, ...filters },
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: this.handleError(error) };
    }
  }
}

export const userService = new UserService();
```

## Hooks para Requests

### 1. Hook Base para API
```javascript
// hooks/useApi.js
import { useState, useEffect } from 'react';

export const useApi = (serviceMethod, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceMethod(...args);
      
      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result.data);
        setError(null);
      }
    } catch (err) {
      setError({
        status: 0,
        message: err.message,
        details: null,
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    execute();
  }, dependencies);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
};
```

### 2. Hook para Mutation
```javascript
// hooks/useMutation.js
import { useState } from 'react';

export const useMutation = (serviceMethod, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await serviceMethod(...args);
      
      if (result.error) {
        setError(result.error);
        options.onError?.(result.error);
        return { success: false, error: result.error };
      } else {
        options.onSuccess?.(result.data);
        return { success: true, data: result.data };
      }
    } catch (err) {
      const error = {
        status: 0,
        message: err.message,
        details: null,
      };
      setError(error);
      options.onError?.(error);
      return { success: false, error };
    } finally {
      setLoading(false);
      options.onSettled?.();
    }
  };

  return {
    mutate,
    loading,
    error,
    reset: () => {
      setError(null);
      setLoading(false);
    },
  };
};
```

### 3. Hooks Específicos
```javascript
// hooks/useUsers.js
import { useApi, useMutation } from './base';
import { userService } from '../services/userService';

export const useUsers = (filters = {}) => {
  return useApi(
    () => userService.getAll(filters),
    [JSON.stringify(filters)]
  );
};

export const useUser = (id) => {
  return useApi(
    () => userService.get(id),
    [id]
  );
};

export const useCreateUser = (options = {}) => {
  return useMutation(userService.create.bind(userService), options);
};

export const useUpdateUser = (options = {}) => {
  return useMutation(userService.update.bind(userService), options);
};

export const useDeleteUser = (options = {}) => {
  return useMutation(userService.delete.bind(userService), options);
};

export const useLogin = (options = {}) => {
  return useMutation(userService.login.bind(userService), options);
};
```

## Cache e State Management

### 1. Query Cache com SWR
```javascript
// lib/swrConfig.js
import { SWRConfig } from 'swr';
import apiClient from './apiClient';

const fetcher = async (url) => {
  const response = await apiClient.get(url);
  return response.data;
};

export const SWRProvider = ({ children }) => {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        onError: (error) => {
          console.error('SWR Error:', error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
};
```

### 2. Hook com SWR
```javascript
// hooks/useSWRApi.js
import useSWR from 'swr';
import { userService } from '../services/userService';

export const useUsers = (filters = {}) => {
  const key = filters ? ['/users', filters] : '/users';
  
  const { data, error, mutate, isLoading } = useSWR(
    key,
    () => userService.getAll(filters)
  );

  return {
    users: data?.data,
    loading: isLoading,
    error: error || data?.error,
    refetch: mutate,
  };
};

export const useUser = (id) => {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/users/${id}` : null,
    () => userService.get(id)
  );

  return {
    user: data?.data,
    loading: isLoading,
    error: error || data?.error,
    refetch: mutate,
  };
};
```

## Upload de Arquivos

### 1. Service para Upload
```javascript
// services/uploadService.js
import apiClient from '../lib/apiClient';

class UploadService {
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          options.onProgress?.(progress);
        },
        ...options,
      });

      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: {
          status: error.response?.status || 0,
          message: error.response?.data?.message || error.message,
        }
      };
    }
  }

  async uploadMultiple(files, options = {}) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    try {
      const response = await apiClient.post('/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          options.onProgress?.(progress);
        },
        ...options,
      });

      return { data: response.data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: {
          status: error.response?.status || 0,
          message: error.response?.data?.message || error.message,
        }
      };
    }
  }
}

export const uploadService = new UploadService();
```

### 2. Hook para Upload
```javascript
// hooks/useUpload.js
import { useState } from 'react';
import { uploadService } from '../services/uploadService';

export const useUpload = (options = {}) => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const upload = async (file) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadService.uploadFile(file, {
        ...options,
        onProgress: (progress) => {
          setProgress(progress);
          options.onProgress?.(progress);
        },
      });

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data };
    } catch (err) {
      const error = { status: 0, message: err.message };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const uploadMultiple = async (files) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadService.uploadMultiple(files, {
        ...options,
        onProgress: (progress) => {
          setProgress(progress);
          options.onProgress?.(progress);
        },
      });

      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      }

      return { success: true, data: result.data };
    } catch (err) {
      const error = { status: 0, message: err.message };
      setError(error);
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    upload,
    uploadMultiple,
    progress,
    loading,
    error,
    reset: () => {
      setProgress(0);
      setError(null);
      setLoading(false);
    },
  };
};
```

## Pagination e Infinite Loading

### 1. Hook para Paginação
```javascript
// hooks/usePagination.js
import { useState } from 'react';
import { useApi } from './useApi';

export const usePagination = (serviceMethod, initialFilters = {}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, loading, error, refetch } = useApi(
    () => serviceMethod({ ...filters, page, limit }),
    [JSON.stringify(filters), page, limit]
  );

  const totalPages = data?.totalPages || 0;
  const total = data?.total || 0;

  return {
    items: data?.items || [],
    loading,
    error,
    page,
    limit,
    totalPages,
    total,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    setPage,
    setLimit,
    setFilters,
    nextPage: () => page < totalPages && setPage(page + 1),
    prevPage: () => page > 1 && setPage(page - 1),
    refetch,
  };
};
```

### 2. Hook para Infinite Loading
```javascript
// hooks/useInfiniteLoad.js
import { useState, useEffect, useCallback } from 'react';

export const useInfiniteLoad = (serviceMethod, initialFilters = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await serviceMethod({ ...filters, page, limit: 20 });
      
      if (result.error) {
        setError(result.error);
      } else {
        const newItems = result.data.items || [];
        
        setItems(prev => page === 1 ? newItems : [...prev, ...newItems]);
        setHasMore(newItems.length > 0);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError({ status: 0, message: err.message });
    } finally {
      setLoading(false);
    }
  }, [serviceMethod, filters, page, loading, hasMore]);

  const refresh = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, []);

  useEffect(() => {
    refresh();
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (page === 1) {
      loadMore();
    }
  }, [page, loadMore]);

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    setFilters,
  };
};
```