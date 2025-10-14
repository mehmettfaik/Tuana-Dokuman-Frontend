// src/components/DocumentForm.jsx
import React, { useState } from 'react';
import { generatePDF } from '../api';
import FabricTechnicalForm from './FabricTechnicalForm';
import ProformaInvoiceForm from './ProformaInvoiceForm';
import InvoiceForm from './InvoiceForm';
import PackingListForm from './PackingListForm';
import CreditNoteForm from './CreditNoteForm';
import DebitNoteForm from './DebitNoteForm';
import OrderConfirmationForm from './OrderConfirmationForm';
import SiparisForm from './SiparisForm'; 
import PriceOfferForm from './PriceOfferForm';
import HangersShipmentForm from './HangersShipmentForm'; 

const fieldMap = {
  fiyatTeklif: [
    { name: 'Müşteri Adı', placeholder: 'Müşteri Adı' },
    { name: 'Ürün', placeholder: 'Ürün Adı' },
    { name: 'Tutar', placeholder: 'Tutar' },
    { name: 'Teslim Süresi', placeholder: 'Teslim Süresi' }
  ]
};

const DocumentForm = ({ selectedDocType, selectedLanguage }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fields = fieldMap[selectedDocType] || [];

  // Eğer teknik föy seçilmişse, özel form komponentini göster
  if (selectedDocType === 'teknikFoy') {
    return <FabricTechnicalForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer proforma invoice seçilmişse, özel form komponentini göster
  if (selectedDocType === 'proformaInvoice') {
    return <ProformaInvoiceForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer invoice seçilmişse, özel form komponentini göster
  if (selectedDocType === 'invoice') {
    return <InvoiceForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer packing list seçilmişse, özel form komponentini göster
  if (selectedDocType === 'packingList') {
    return <PackingListForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer credit note seçilmişse, özel form komponentini göster
  if (selectedDocType === 'creditNote') {
    return <CreditNoteForm selectedLanguage={selectedLanguage} />;
  }
  // Eğer debit note seçilmişse, özel form komponentini göster
  if (selectedDocType === 'debitNote') {
    return <DebitNoteForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer order confirmation seçilmişse, özel form komponentini göster
  if (selectedDocType === 'orderConfirmation') {
    return <OrderConfirmationForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer sipariş formu seçilmişse, özel form komponentini göster
  if (selectedDocType === 'siparis') {
    return <SiparisForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer price offer seçilmişse, özel form komponentini göster
  if (selectedDocType === 'priceOffer') {
    return <PriceOfferForm selectedLanguage={selectedLanguage} />;
  }

  // Eğer hangers shipment seçilmişse, özel form komponentini göster
  if (selectedDocType === 'hangersShipment') {
    return <HangersShipmentForm selectedLanguage={selectedLanguage} />;
  }

  const handleChange = (e, fieldName) => {
    setFormData({ ...formData, [fieldName]: e.target.value });
    setError(null); // Yeni input girildiğinde hata mesajını temizle
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const blob = await generatePDF(selectedDocType, formData);
      
      // PDF blob'unu doğru MIME type ile oluştur
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      
      // Blob'un boyutunu kontrol et
      if (pdfBlob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      // URL oluştur ve indir
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedDocType}_${Date.now()}.pdf`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url); // URL'i temizle
      
      // Başarı mesajı
      console.log('PDF successfully downloaded');
    } catch (err) {
      setError(err.message || "PDF oluşturulurken bir hata oluştu.");
      console.error("PDF generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDocType) return null;

  return (
    <form onSubmit={handleSubmit} className="document-form">
      <h3>{selectedDocType.toUpperCase()} Bilgileri</h3>
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {fields.map((field) => (
        <div key={field.name} className="form-field">
          <input
            type="text"
            placeholder={field.placeholder}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(e, field.name)}
            required
            disabled={loading}
          />
        </div>
      ))}
      <button type="submit" disabled={loading} style={{ position: 'relative' }}>
        {loading ? 'İşleniyor...' : 'PDF Oluştur'}
      </button>
    </form>
  );
};

export default DocumentForm;
