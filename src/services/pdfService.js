// services/pdfService.js
class PDFService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://tuana-dokuman-backend.onrender.com';
  }

  // Backend bağlantısını test et
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.warn('Backend servisi erişilebilir değil:', error);
      return false;
    }
  }

  // 1. PDF üretimini başlat
  async startPDFGeneration(docType, formData, language = 'en') {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/start`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docType,
          formData,
          language
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.jobId;
    } catch (error) {
      console.error('Error starting PDF generation:', error);
      throw error;
    }
  }

  // 2. PDF durumunu kontrol et
  async checkPDFStatus(jobId) {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/status/${jobId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking PDF status:', error);
      throw error;
    }
  }

  // 3. PDF'i indir
  async downloadPDF(jobId, fileName = 'document.pdf') {
    try {
      const response = await fetch(`${this.baseURL}/api/pdf/download/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Blob'un boyutunu kontrol et
      if (blob.size === 0) {
        throw new Error('Received empty PDF file from server');
      }
      
      // Dosyayı indir
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  // Polling ile durum kontrolü (otomatik kontrol)
  async waitForPDFCompletion(jobId, onProgress = null, timeout = 60000) {
    const startTime = Date.now();
    const pollInterval = 1000; // 1 saniye

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          if (Date.now() - startTime > timeout) {
            reject(new Error('PDF generation timeout'));
            return;
          }

          const status = await this.checkPDFStatus(jobId);
          
          // Progress callback'i varsa çağır
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            resolve(status);
          } else if (status.status === 'failed') {
            reject(new Error(status.error || 'PDF generation failed'));
          } else {
            // Hala pending/processing, tekrar kontrol et
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Form type'a göre dosya adı oluştur
  generateFileName(docType, formData) {
    const timestamp = Date.now();
    
    switch (docType) {
      case 'proforma-invoice':
        const proformaNumber = formData['PROFORMA INVOICE NUMBER'] || 'Proforma';
        const proformaCompany = formData['RECIPIENT Şirket Adı'] || 'Company';
        const safeProformaName = `${proformaNumber}_${proformaCompany}`.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeProformaName}_Proforma-Invoice.pdf`;
        
      case 'invoice':
        const invoiceNumber = formData['INVOICE NUMBER'] || 'Invoice';
        const invoiceCompany = formData['RECIPIENT Şirket Adı'] || 'Company';
        const safeInvoiceName = `${invoiceNumber}_${invoiceCompany}`.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeInvoiceName}_Invoice.pdf`;
        
      case 'packing-list':
        const packingInvoiceNumber = formData['INVOICE NUMBER'] || 'No-Invoice-Number';
        const packingCompany = formData['RECIPIENT Şirket Adı'] || 'Company';
        const safePackingName = `${packingInvoiceNumber}_${packingCompany}`.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safePackingName}_Packing-List.pdf`;
        
      case 'credit-note':
        const creditNumber = formData['CREDIT NOTE NUMBER'] || 'Credit-Note';
        const safeCreditNumber = creditNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeCreditNumber}_Credit-Note.pdf`;
        
      case 'debit-note':
        const debitNumber = formData['DEBIT NOTE NUMBER'] || 'Debit-Note';
        const safeDebitNumber = debitNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeDebitNumber}_Debit-Note.pdf`;
        
      case 'order-confirmation':
        const orderConfirmationNumber = formData['ORDER CONFIRMATION NUMBER'] || 'Order-Confirmation';
        const safeOrderConfirmationNumber = orderConfirmationNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeOrderConfirmationNumber}_Order-Confirmation.pdf`;
        
      case 'siparis':
        const orderNumber = formData['ORDER NUMBER'] || 'No-Order-Number';
        const safeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeOrderNumber}_Siparis-Formu.pdf`;
        
      case 'price-offer':
        const priceOfferNumber = formData['PRICE OFFER NUMBER'] || 'No-Price-Offer-Number';
        const safePriceOfferNumber = priceOfferNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safePriceOfferNumber}_Price-Offer.pdf`;
        
      case 'fabric-technical':
        const articleCode = formData['ARTICLE CODE'] || 'Technical';
        const safeArticleCode = articleCode.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeArticleCode}_Technical-Specification.pdf`;
        
      default:
        return `${docType}_${timestamp}.pdf`;
    }
  }

  // Ana PDF üretim fonksiyonu - Production için
  async generatePDFWithFallback(formData, docType, language = 'en') {
    try {
      console.log('Starting PDF generation with backend API');
      const jobId = await this.startPDFGeneration(docType, formData, language);
      await this.waitForPDFCompletion(jobId);
      const fileName = this.generateFileName(docType, formData);
      return await this.downloadPDF(jobId, fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
      
      // Backend bağlantı hatalarını kullanıcı dostu mesajlara çevir
      if (error.message.includes('500') || error.message.includes('502') || error.message.includes('Load failed')) {
        throw new Error('Backend servisi şu anda bakımda. Lütfen birkaç dakika sonra tekrar deneyin.');
      } else if (error.message.includes('404')) {
        throw new Error('PDF oluşturma servisi bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
      } else if (error.message.includes('timeout')) {
        throw new Error('PDF oluşturma işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else {
        throw new Error(`PDF oluşturulamadı: ${error.message}`);
      }
    }
  }
}

const pdfService = new PDFService();
export default pdfService;
