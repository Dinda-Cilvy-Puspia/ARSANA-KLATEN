import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = Cookies.get('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error || error.message || 'An error occurred';
        
        if (error.response?.status === 401) {
          Cookies.remove('authToken');
          // Pastikan hanya berjalan di sisi klien
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          return Promise.reject(error);
        }

        if (error.response?.status >= 500) {
          toast.error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(credentials: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', credentials);
    return response.data;
  }

  async register(data: { email: string; password: string; name: string; role?: string }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  // User methods
  async getCurrentUser() {
    const response = await this.client.get('/users/me');
    return response.data;
  }

  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  // Incoming Letters methods
  async getIncomingLetters(params?: { page?: number; limit?: number; search?: string; category?: string; }) {
    const response = await this.client.get('/incoming-letters', { params });
    return response.data;
  }

  async getIncomingLetterById(id: string) {
    const response = await this.client.get(`/incoming-letters/${id}`);
    return response.data;
  }

  async createIncomingLetter(data: FormData) {
    // Debug: Log FormData contents before sending
    if (process.env.NODE_ENV === 'development') {
      console.group('📤 Creating Incoming Letter');
      console.log('📋 FormData Contents:');
      // Use Array.from for better TypeScript compatibility
      const entries = Array.from(data.entries());
      entries.forEach(([key, value]) => {
        if (value instanceof File) {
          console.log(`  ${key}:`, {
            name: value.name,
            type: value.type,
            size: `${(value.size / 1024).toFixed(2)} KB`
          });
        } else {
          console.log(`  ${key}:`, value);
        }
      });
      console.groupEnd();
    }

    try {
      const response = await this.client.post('/incoming-letters', data);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Success:', response.data);
      }
      
      return response.data;
    } catch (error: any) {
      // Enhanced error logging for 409 conflicts
      if (error.response?.status === 409) {
        const errorData = error.response.data;
        console.error('❌ Conflict Error (409):', {
          message: errorData.error,
          field: errorData.field,
          details: errorData.details
        });
        
        // Show user-friendly toast
        const fieldName = errorData.field || 'data';
        const friendlyMessage = errorData.error || `${fieldName} sudah terdaftar`;
        toast.error(friendlyMessage);
      }
      
      throw error;
    }
  }

  async updateIncomingLetter(id: string, data: FormData) {
    const response = await this.client.put(`/incoming-letters/${id}`, data);
    return response.data;
  }

  async deleteIncomingLetter(id: string) {
    const response = await this.client.delete(`/incoming-letters/${id}`);
    return response.data;
  }

  // Outgoing Letters methods
  async getOutgoingLetters(params?: { page?: number; limit?: number; search?: string; category?: string; }) {
    const response = await this.client.get('/outgoing-letters', { params });
    return response.data;
  }

  async getOutgoingLetterById(id: string) {
    const response = await this.client.get(`/outgoing-letters/${id}`);
    return response.data;
  }

  async createOutgoingLetter(data: FormData) {
    const response = await this.client.post('/outgoing-letters', data);
    return response.data;
  }

  async updateOutgoingLetter(id: string, data: FormData) {
    const response = await this.client.put(`/outgoing-letters/${id}`, data);
    return response.data;
  }

  async deleteOutgoingLetter(id: string) {
    const response = await this.client.delete(`/outgoing-letters/${id}`);
    return response.data;
  }


  async getDispositionsByLetter(letterId: string) {
    // Menggunakan URL yang benar sesuai rute backend
    const response = await this.client.get(`/dispositions/letter/${letterId}`);
    return response.data;
  }

  async getFileInfo(id: string, type: 'incoming' | 'outgoing') {
    const response = await this.client.get(`/files/${type}/${id}/info`);
    return response.data;
  }
   
  async downloadFile(type: 'incoming' | 'outgoing', id: string) {
    
    return this.client.get(`/files/${type}/${id}`, {
      responseType: 'blob',
    });
  }

  async previewFile(type: 'incoming' | 'outgoing', id: string) {
    return this.client.get(`/files/${type}/${id}/preview`, {
      responseType: 'blob',
    });
  }

  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean; }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationAsRead(id: string) {
    const response = await this.client.put(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.client.put('/notifications/read-all');
    return response.data;
  }

  // Calendar methods
  async getCalendarEvents(params?: { start?: string; end?: string }) {
    const response = await this.client.get('/calendar/events', { params });
    return response.data;
  }

  async getUpcomingEvents(params?: { limit?: number }) {
    const response = await this.client.get('/calendar/upcoming', { params });
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

const apiClient = new ApiClient();
export default apiClient;