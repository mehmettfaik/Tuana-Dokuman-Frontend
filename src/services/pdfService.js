// services/pdfService.js
class PDFService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    this.legacyBaseURL = process.env.REACT_APP_LEGACY_API_URL || 'http://localhost:3000';
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
      console.warn('New API not available, will use legacy API');
      return false;
    }
  }

  // Demo/Mock PDF generation (offline çalışma için)
  async generatePDFDemo(formData, docType, language = 'en') {
    try {
      console.log('Using demo PDF generation (offline mode)');
      
      // Demo için basit HTML to PDF conversion
      const demoHtml = this.generateDemoHTML(formData, docType, language);
      
      // Simple demo PDF content as HTML
      const demoWindow = window.open('', '_blank');
      demoWindow.document.write(demoHtml);
      demoWindow.document.close();
      
      // Print dialog açarak kullanıcının PDF olarak kaydetmesini sağla
      setTimeout(() => {
        demoWindow.print();
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Demo PDF generation error:', error);
      
      // Basit alert ile demo PDF bilgisi göster
      const formInfo = Object.entries(formData)
        .slice(0, 5)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
        
      alert(`DEMO PDF OLUŞTURULDU\n\nBelge Türü: ${docType}\nDil: ${language}\n\nForm Bilgileri:\n${formInfo}\n\nNot: Bu demo modda çalışmaktadır. Gerçek PDF için backend servisi gereklidir.`);
      
      return true;
    }
  }

  // Demo HTML içeriği oluştur
  generateDemoHTML(formData, docType, language) {
    const timestamp = new Date().toLocaleDateString('tr-TR');
    const formEntries = Object.entries(formData);
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>DEMO - ${docType.toUpperCase()}</title>
        <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { background: #f0f0f0; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
            .demo-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
            .form-data { border-collapse: collapse; width: 100%; }
            .form-data th, .form-data td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .form-data th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>DEMO PDF - ${docType.toUpperCase()}</h1>
            <p>Oluşturulma Tarihi: ${timestamp}</p>
            <p>Dil: ${language}</p>
        </div>
        
        <div class="demo-notice">
            <strong>⚠️ DEMO MOD AKTIF</strong><br>
            Bu PDF demo amaçlı oluşturulmuştur. Backend servisi aktif olduğunda gerçek PDF üretilecektir.
        </div>
        
        <h2>Form Verileri</h2>
        <table class="form-data">
            <thead>
                <tr>
                    <th>Alan</th>
                    <th>Değer</th>
                </tr>
            </thead>
            <tbody>
                ${formEntries.map(([key, value]) => `
                    <tr>
                        <td>${key}</td>
                        <td>${value || 'Boş'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>Bu belge ${timestamp} tarihinde demo modda oluşturulmuştur.</p>
            <p>Gerçek PDF üretimi için backend servisi gereklidir.</p>
        </div>
    </body>
    </html>
    `;
  }

  // Demo içerik oluştur
  generateDemoContent(formData, docType, language) {
    const fields = Object.keys(formData).length;
    const timestamp = new Date().toLocaleDateString('tr-TR');
    
    return {
      docType,
      language,
      fields,
      timestamp,
      message: 'Bu bir demo PDF\'dir. Backend servisi aktif olduğunda gerçek PDF üretilecektir.'
    };
  }

  // Legacy PDF generation (fallback)
  async generatePDFLegacy(formData, docType, language = 'en') {
    try {
      const response = await fetch(`${this.legacyBaseURL}/api/generatePDF`, {
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
        throw new Error(`Legacy API error! status: ${response.status}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Received empty PDF file from legacy server');
      }
      
      // Dosyayı indir
      const fileName = this.generateFileName(docType, formData);
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
      console.error('Legacy PDF generation error:', error);
      throw error;
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

  // Ana PDF üretim fonksiyonu - Fallback desteği ile
  async generatePDFWithFallback(formData, docType, language = 'en') {
    try {
      // Önce yeni API'yi dene
      const isConnected = await this.testConnection();
      
      if (isConnected) {
        console.log('Using new 3-stage PDF API');
        const jobId = await this.startPDFGeneration(docType, formData, language);
        await this.waitForPDFCompletion(jobId);
        const fileName = this.generateFileName(docType, formData);
        return await this.downloadPDF(jobId, fileName);
      } else {
        console.log('New API not available, trying legacy API');
        return await this.generatePDFLegacy(formData, docType, language);
      }
    } catch (error) {
      console.error('Primary PDF generation failed, trying legacy API:', error);
      try {
        return await this.generatePDFLegacy(formData, docType, language);
      } catch (legacyError) {
        console.error('Legacy API also failed, using demo PDF generation:', legacyError);
        try {
          return await this.generatePDFDemo(formData, docType, language);
        } catch (demoError) {
          console.error('All PDF generation methods failed:', demoError);
          throw new Error(`PDF oluşturulamadı. Tüm sistemler devre dışı. (Error: ${error.message})`);
        }
      }
    }
  }
}

const pdfService = new PDFService();
export default pdfService;
