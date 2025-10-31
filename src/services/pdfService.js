// services/pdfService.js
class PDFService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  // Backend bağlantısını test et
  async testConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
      
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log('Backend health check:', data);
        return true;
      } else {
        console.warn('Backend health check failed:', response.status);
        return false;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Backend health check timeout');
      } else {
        console.warn('Backend servisi erişilebilir değil:', error.message);
      }
      return false;
    }
  }

  // 1. PDF üretimini başlat
  async startPDFGeneration(docType, formData, language = 'en') {
    try {
      console.log(`Starting PDF generation for docType: ${docType}, language: ${language}`);
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
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('PDF start generation error details:', errorData);
          
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          if (errorData.details) {
            errorMessage += ` - Details: ${errorData.details}`;
          }
          if (errorData.stack) {
            console.error('Backend stack trace:', errorData.stack);
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
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
      console.log(`Checking PDF status for job: ${jobId}`);
      const response = await fetch(`${this.baseURL}/api/pdf/status/${jobId}`);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Backend error details:', errorData);
          
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          if (errorData.details) {
            errorMessage += ` - Details: ${errorData.details}`;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const statusData = await response.json();
      console.log('PDF status response:', statusData);
      return statusData;
    } catch (error) {
      console.error('Error checking PDF status for job:', jobId, error);
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
    let pollCount = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          pollCount++;
          const elapsed = Date.now() - startTime;
          
          if (elapsed > timeout) {
            console.error(`PDF generation timeout after ${elapsed}ms for job: ${jobId}`);
            reject(new Error(`PDF generation timeout after ${Math.round(elapsed/1000)}s (Job: ${jobId})`));
            return;
          }

          console.log(`Polling PDF status (attempt ${pollCount}) for job: ${jobId}`);
          const status = await this.checkPDFStatus(jobId);
          
          // Progress callback'i varsa çağır
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            console.log(`PDF generation completed for job: ${jobId}`);
            resolve(status);
          } else if (status.status === 'failed') {
            console.error(`PDF generation failed for job: ${jobId}`, status);
            const errorMessage = status.error || status.message || 'PDF generation failed';
            const detailedError = `PDF Generation Failed (Job: ${jobId}) - ${errorMessage}`;
            
            if (status.details) {
              console.error('Failure details:', status.details);
            }
            if (status.stack) {
              console.error('Stack trace:', status.stack);
            }
            
            reject(new Error(detailedError));
          } else {
            // Hala pending/processing, tekrar kontrol et
            console.log(`PDF status: ${status.status} for job: ${jobId}, retrying in ${pollInterval}ms`);
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          console.error(`Error during PDF status polling for job: ${jobId}`, error);
          reject(error);
        }
      };

      poll();
    });
  }

  // Form type'a göre dosya adı oluştur
  generateFileName(docType, formData, language = 'en') {
    const timestamp = Date.now();
    // Hem yeni (tr/en) hem eski (turkish/english) formatları destekle
    const isTurkish = language === 'tr' || language === 'turkish';
    
    switch (docType) {
      case 'proforma-invoice':
        const proformaNumber = formData['PROFORMA INVOICE NUMBER'] || 'Proforma';
        const proformaCompany = formData['RECIPIENT Şirket Adı'] || 'Company';
        const safeProformaName = `${proformaNumber}_${proformaCompany}`.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeProformaName}_${isTurkish ? 'Proforma-Fatura' : 'Proforma-Invoice'}.pdf`;
        
      case 'invoice':
        const invoiceCompany = formData['RECIPIENT Şirket Adı'] || 'Company';
        const safeInvoiceName = `${invoiceCompany}`.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeInvoiceName}_${isTurkish ? 'Fatura' : 'Invoice'}.pdf`;
        
      case 'packing-list':
        const packingCompany = formData['RECIPIENT Şirket Adı'] || 'Company';
        let articleNumberFull = formData['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'] || '';
        
        // Eğer direkt field boşsa, packingItems array'ini kontrol et
        if (!articleNumberFull && formData.packingItems && formData.packingItems.length > 0) {
          articleNumberFull = formData.packingItems[0]['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'] || '';
        }
        
        // Eğer hala boşsa, goods array'ini kontrol et
        if (!articleNumberFull && formData.goods && formData.goods.length > 0) {
          articleNumberFull = formData.goods[0]['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'] || '';
        }
        
        // Varsayılan değer ata
        if (!articleNumberFull) {
          articleNumberFull = 'No-Article';
        }
        
        // İlk "/" işaretine kadar olan kısmı al
        const articlePrefix = articleNumberFull.split('/')[0].trim();
        const safeArticlePrefix = articlePrefix.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        const safePackingCompany = packingCompany.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        
        return `${safeArticlePrefix}-${safePackingCompany}-${isTurkish ? 'Çeki-Listesi' : 'Packing-List'}.pdf`;
        
      case 'credit-note':
        const creditNumber = formData['CREDIT NOTE NUMBER'] || 'Credit-Note';
        const safeCreditNumber = creditNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeCreditNumber}_${isTurkish ? 'Iade-Faturasi' : 'Credit-Note'}.pdf`;
        
      case 'debit-note':
        const debitNumber = formData['DEBIT NOTE NUMBER'] || 'Debit-Note';
        const safeDebitNumber = debitNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeDebitNumber}_${isTurkish ? 'Debit-Note' : 'Debit-Note'}.pdf`;
        
      case 'order-confirmation':
        const orderConfirmationCompany =  formData['RECIPIENT Şirket Adı'] || 'Company';
        const safeOrderConfirmationCompany = orderConfirmationCompany.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeOrderConfirmationCompany}_${isTurkish ? 'Siparis-Onay' : 'Order-Confirmation'}.pdf`;

      case 'siparis':
        const orderNumber = formData['ORDER NUMBER'] || 'No-Order-Number';
        const safeOrderNumber = orderNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeOrderNumber}_${isTurkish ? 'Siparis-Formu' : 'Order-Form'}.pdf`;
        
      case 'price-offer':
        const priceOfferNumber = formData['PRICE OFFER NUMBER'] || 'No-Price-Offer-Number';
        const safePriceOfferNumber = priceOfferNumber.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safePriceOfferNumber}_${isTurkish ? 'Fiyat-Teklifi' : 'Price-Offer'}.pdf`;
        
      case 'fabric-technical':
        const articleCode = formData['ARTICLE CODE'] || 'Technical';
        const safeArticleCode = articleCode.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeArticleCode}_${isTurkish ? 'Teknik-Foy' : 'Technical-Specification'}.pdf`;

      case 'hangers-shipment':
        const trackingCode = formData['TRACKING CODE'] || 'No-Tracking';
        const courier = formData['COURIER'] || 'No-Courier';
        const safeTrackingName = `${trackingCode}_${courier}`.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-');
        return `${safeTrackingName}_${isTurkish ? 'Aski-Gonderi-Detay' : 'Hangers-Shipment-Details'}.pdf`;
        
      default:
        return `${docType}_${timestamp}.pdf`;
    }
  }

  // Ana PDF üretim fonksiyonu - Production için
  async generatePDFWithFallback(formData, docType, language = 'en') {
    try {
      console.log('Starting PDF generation with backend API');
      
      // Backend durumunu kontrol et
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('Backend servisi şu anda erişilebilir değil.');
      }
      
      const jobId = await this.startPDFGeneration(docType, formData, language);
      await this.waitForPDFCompletion(jobId);
      const fileName = this.generateFileName(docType, formData, language);
      return await this.downloadPDF(jobId, fileName);
    } catch (error) {
      console.error('PDF generation failed:', error);
      
      // Backend bağlantı hatalarını kullanıcı dostu mesajlara çevir
      if (error.message.includes('template.generate is not a function')) {
        throw new Error('PDF şablonu hatası tespit edildi. Backend geliştirici ekibi bilgilendirildi. Lütfen daha sonra tekrar deneyin.');
      } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('Load failed')) {
        throw new Error('Backend servisi şu anda bakımda. Lütfen birkaç dakika sonra tekrar deneyin.');
      } else if (error.message.includes('404')) {
        throw new Error('PDF oluşturma servisi bulunamadı. Lütfen sistem yöneticisi ile iletişime geçin.');
      } else if (error.message.includes('timeout')) {
        throw new Error('PDF oluşturma işlemi zaman aşımına uğradı. Lütfen tekrar deneyin.');
      } else if (error.message.includes('Backend servisi şu anda erişilebilir değil')) {
        throw new Error('Backend servisi şu anda bakımda. Lütfen daha sonra tekrar deneyin.');
      } else {
        throw new Error(`PDF oluşturulamadı: ${error.message}`);
      }
    }
  }
}

const pdfService = new PDFService();
export default pdfService;
