// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

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
    
    // PDF blob'unu doğrula
    console.log('Response content type:', res.headers['content-type']);
    console.log('Response data type:', res.data.type);
    console.log('Response data size:', res.data.size);
    
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

