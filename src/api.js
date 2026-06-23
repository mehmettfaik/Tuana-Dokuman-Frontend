// src/api.js
import axios from 'axios';
import { auth } from './firebase/config';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor - Her istekte authentication token ekle
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token alınamadı:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Token expire durumunu handle et
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Token expire olduysa yenile ve tekrar dene
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const user = auth.currentUser;
        if (user) {
          console.log('🔄 Token yenileniyor...');
          const token = await user.getIdToken(true); // Force refresh
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh başarısız:', refreshError);
        // Kullanıcı otomatik olarak logout olacak (AuthContext'te handle ediliyor)
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const generatePDF = async (formData, formType = 'fabric-technical', language = 'turkish') => {
  try {
    // Yeni endpoint'leri kullan
    let endpoint;
    if (formType === 'proforma-invoice') {
      endpoint = '/api/pdf/generate-proforma';
    } else if (formType === 'fabric-technical') {
      endpoint = '/api/pdf/generate-technical';
    } else if (formType === 'invoice') {
      endpoint = '/api/pdf/generate-invoice';
    } else if (formType === 'packing-list') {
      endpoint = '/api/pdf/generate-packing-list';
    } else if (formType === 'credit-note') {
      endpoint = '/api/pdf/generate-credit-note';
    } else if (formType === 'debit-note') {
      endpoint = '/api/pdf/generate-debit-note';
    } else if (formType === 'order-confirmation') {
      endpoint = '/api/pdf/generate-order-confirmation';
    } else if (formType === 'siparis') {
      endpoint = '/api/pdf/generate-siparis';
    } else if (formType === 'price-offer') {
      endpoint = '/api/pdf/generate-price-offer';
    } else if (formType === 'quality-control') {
      endpoint = '/api/pdf/generate-quality-control';
    } else {
      // Genel endpoint (eski API uyumluluğu için)
      endpoint = '/api/pdf/generate';
    }

    const res = await api.post(
      endpoint,
      { 
        formData,
        language 
      },
      { 
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        timeout: 120000 // 120 saniye timeout
      }
    );
    
    if (!res.data) {
      throw new Error('No data received from server');
    }
    
    if (res.data.size === 0) {
      throw new Error('Received empty file from server');
    }
    
    if (res.data.type && !res.data.type.includes('pdf') && !res.data.type.includes('octet-stream')) {
      // Eğer response PDF değilse, muhtemelen hata mesajı JSON formatında gelmiştir
      const text = await res.data.text();
      try {
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Server returned non-PDF data');
      } catch {
        throw new Error('Server returned invalid PDF data');
      }
    }
    
    return res.data;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Server is taking too long to respond.');
    }
    
    if (error.response) {
      // Server yanıt verdi ama hata döndü
      const message = error.response.data?.message || `Server error: ${error.response.status}`;
      throw new Error(message);
    } else if (error.request) {
      // İstek yapıldı ama yanıt alınamadı
      if (error.message.includes('Network Error')) {
        throw new Error('Server is not accessible. Please check if the server is running on port 3001.');
      }
      throw new Error('No response received from server. Please try again.');
    } else {
      // İstek oluşturulurken hata oluştu
      throw new Error(`Request failed: ${error.message}`);
    }
  }
};

// ============================================
// FORM KAYIT YÖNETİMİ API FONKSİYONLARI
// ============================================

/**
 * Yeni form kaydı oluşturur
 * @param {Object} formData - Form verileri (formData, goods, totals içerebilir)
 * @param {string} formType - Form tipi (örn: 'siparis', 'proforma-invoice')
 * @returns {Promise} - Kaydedilen form verisi
 */
export const createFormRecord = async (formData, formType) => {
  try {
    // formData objesi içinde goods, packingItems veya totals olabilir, onları ayrıştır
    const { goods, packingItems, totals, ...actualFormData } = formData;
    // Ensure packingItems and goods are available both at root and inside formData
    const payload = {
      formData: {
        ...actualFormData,
        packingItems: packingItems || [],
        goods: goods || []
      },
      goods: goods || [],
      packingItems: packingItems || [],
      totals: totals || null,
      formType,
      createdAt: new Date().toISOString()
    };
    
    const response = await api.post('/api/forms', payload);
  
    return response.data;
  } catch (error) {
    console.error('Form kaydı oluşturulurken hata:', error);
    throw error;
  }
};

/**
 * Tüm form kayıtlarını listeler
 * @param {string} formType - (Opsiyonel) Filtrelemek için form tipi
 * @returns {Promise} - Form kayıtları listesi
 */
export const getFormRecords = async (formType = null) => {
  try {
    const url = formType ? `/api/forms?formType=${formType}` : '/api/forms';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Form kayıtları alınırken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir form kaydını getirir
 * @param {string} formId - Form ID
 * @returns {Promise} - Form verisi
 */
export const getFormRecord = async (formId) => {
  try {
    const response = await api.get(`/api/forms/${formId}`);
    return response.data;
  } catch (error) {
    console.error('Form kaydı alınırken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir form kaydını siler
 * @param {string} formId - Form ID
 * @returns {Promise}
 */
export const deleteFormRecord = async (formId) => {
  try {
    const response = await api.delete(`/api/forms/${formId}`);
    return response.data;
  } catch (error) {
    console.error('Form kaydı silinirken hata:', error);
    throw error;
  }
};

