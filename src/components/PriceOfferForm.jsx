import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import '../css/PriceOfferForm.css';

const PriceOfferForm = ({ selectedLanguage }) => {
  const [formData, setFormData] = useState({
    // Price Offer specific fields
    'ISSUE DATE': '',
    'PRICE OFFER NUMBER': '',
    
    // From/To Information (similar to Responsible Person and Recipient)
    'FROM': '',
    'TO': '',
    
    // Payment & Transport (from InvoiceForm)
    'PAYMENT TERMS': '',
    'TRANSPORT TYPE': '',
  });

  // Price Offer Items - özel alanlarla
  const [priceItems, setPriceItems] = useState([
    {
      id: 1,
      'ARTICLE NUMBER': '',
      'PRICE (PER METER)': '',
      'BULK MOQ (METERS)': '',
      'SAMPLING AVAILABILITY (1-100 METERS)': '',
      'LEAD TIME': '',
      'PROCESS': '',
      'CERTIFIABLE': ''
    }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Yeni PDF generation hook'u
  const { isGenerating, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Ürün verilerini güncelleme
  const handlePriceItemChange = (id, field, value) => {
    setPriceItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Yeni ürün ekleme
  const addPriceItem = () => {
    const newId = Math.max(...priceItems.map(item => item.id)) + 1;
    setPriceItems(prev => [...prev, {
      id: newId,
      'ARTICLE NUMBER': '',
      'PRICE (PER METER)': '',
      'BULK MOQ (METERS)': '',
      'SAMPLING AVAILABILITY (1-100 METERS)': '',
      'LEAD TIME': '',
      'PROCESS': '',
      'CERTIFIABLE': ''
    }]);
  };

  // Ürün silme
  const removePriceItem = (id) => {
    if (priceItems.length > 1) {
      setPriceItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Form gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const requestData = {
        formData: formData,
        priceItems: priceItems
      };

      console.log('Gönderilen price offer data:', requestData);
      
      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(requestData, 'price-offer', selectedLanguage);
      
      if (success) {
        setSuccess('Price Offer PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Price Offer gönderilirken bir hata oluştu: ' + (err.message || err.toString()));
    }
  };

  // Form sıfırlama
  const handleReset = () => {
    setFormData({
      'ISSUE DATE': '',
      'PRICE OFFER NUMBER': '',
      'FROM': '',
      'TO': '',
      'PAYMENT TERMS': '',
      'TRANSPORT TYPE': '',
    });
    
    setPriceItems([{
      id: 1,
      'ARTICLE NUMBER': '',
      'PRICE (PER METER)': '',
      'BULK MOQ (METERS)': '',
      'SAMPLING AVAILABILITY (1-100 METERS)': '',
      'LEAD TIME': '',
      'PROCESS': '',
      'CERTIFIABLE': ''
    }]);
    
    setError('');
    setSuccess('');
  };

  return (
    <div className="price-offer-form-container">
      <div className="price-offer-form-header">
        <h2>PRICE OFFER</h2>
        <p>Fiyat teklifi bilgilerini doldurun ve PDF olarak oluşturun</p>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {pdfError && (
        <div className="alert alert-error">
          {pdfError}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="price-offer-form">
        {/* Price Offer Information */}
        <div className="form-section">
          <h3 className="section-title">Price Offer Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">ISSUE DATE</label>
              <input
                type="date"
                className="form-input"
                value={formData['ISSUE DATE']}
                onChange={(e) => handleInputChange('ISSUE DATE', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">PRICE OFFER NUMBER</label>
              <input
                type="text"
                className="form-input"
                value={formData['PRICE OFFER NUMBER']}
                onChange={(e) => handleInputChange('PRICE OFFER NUMBER', e.target.value)}
                placeholder="Fiyat teklif numarasını girin"
                required
              />
            </div>
          </div>
        </div>

        {/* From/To Information */}
        <div className="form-section">
          <h3 className="section-title">Company Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">FROM</label>
              <textarea
                className="form-textarea"
                value={formData['FROM']}
                onChange={(e) => handleInputChange('FROM', e.target.value)}
                placeholder="Gönderen şirket bilgilerini girin"
                rows="4"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">TO</label>
              <textarea
                className="form-textarea"
                value={formData['TO']}
                onChange={(e) => handleInputChange('TO', e.target.value)}
                placeholder="Alıcı şirket bilgilerini girin"
                rows="4"
                required
              />
            </div>
          </div>
        </div>

        {/* Payment & Transport Details */}
        <div className="form-section">
          <h3 className="section-title">Payment & Transport Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">PAYMENT TERMS</label>
              <select
                className="form-input"
                value={formData['PAYMENT TERMS']}
                onChange={(e) => handleInputChange('PAYMENT TERMS', e.target.value)}
              >
                <option value="">Ödeme vadesi seçin</option>
                <option value="30 DAYS">30 DAYS</option>
                <option value="60 DAYS">60 DAYS</option>
                <option value="90 DAYS">90 DAYS</option>
                <option value="120 DAYS">120 DAYS</option>
                <option value="150 DAYS">150 DAYS</option>
                <option value="180 DAYS">180 DAYS</option>
                <option value="IMMEDIATELY">IMMEDIATELY</option>
                <option value="CASH IN ADVANCE">CASH IN ADVANCE</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">TRANSPORT TYPE</label>
              <select
                className="form-input"
                value={formData['TRANSPORT TYPE']}
                onChange={(e) => handleInputChange('TRANSPORT TYPE', e.target.value)}
              >
                <option value="">Taşıma türü seçin</option>
                <option value="CIF">CIF</option>
                <option value="FOB">FOB</option>
                <option value="EXW">EXW</option>
                <option value="DAP">DAP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Price Items */}
        <div className="form-section">
          <div className="items-header">
            <h3 className="section-title">PRICE ITEMS</h3>
            <button
              type="button"
              className="btn btn-add-item"
              onClick={addPriceItem}
            >
              + Yeni Ürün Ekle
            </button>
          </div>
          
          {priceItems.map((item, index) => (
            <div key={item.id} className="price-item">
              <div className="price-item-header">
                <h4 className="price-item-title">Ürün #{index + 1}</h4>
                {priceItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-remove-item"
                    onClick={() => removePriceItem(item.id)}
                  >
                    × Sil
                  </button>
                )}
              </div>
              
              <div className="price-item-container">
                <div className="price-grid-row">
                  <div className="form-group">
                    <label className="form-label">ARTICLE NUMBER</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['ARTICLE NUMBER']}
                      onChange={(e) => handlePriceItemChange(item.id, 'ARTICLE NUMBER', e.target.value)}
                      placeholder="Artikel numarası"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">PRICE (PER METER)</label>
                    <input
                      type="text"
                      className="form-input price-input"
                      value={item['PRICE (PER METER)']}
                      onChange={(e) => handlePriceItemChange(item.id, 'PRICE (PER METER)', e.target.value)}
                      placeholder="Metre başına fiyat (USD/EUR/TRY)"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">BULK MOQ (METERS)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['BULK MOQ (METERS)']}
                      onChange={(e) => handlePriceItemChange(item.id, 'BULK MOQ (METERS)', e.target.value)}
                      placeholder="Minimum sipariş miktarı (metre)"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="price-grid-row">
                  <div className="form-group">
                    <label className="form-label">SAMPLING AVAILABILITY (1-100 METERS)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['SAMPLING AVAILABILITY (1-100 METERS)']}
                      onChange={(e) => handlePriceItemChange(item.id, 'SAMPLING AVAILABILITY (1-100 METERS)', e.target.value)}
                      placeholder="Numune mevcut durumu"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">LEAD TIME</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['LEAD TIME']}
                      onChange={(e) => handlePriceItemChange(item.id, 'LEAD TIME', e.target.value)}
                      placeholder="Teslimat süresi"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">PROCESS</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['PROCESS']}
                      onChange={(e) => handlePriceItemChange(item.id, 'PROCESS', e.target.value)}
                      placeholder="İşlem"
                    />
                  </div>
                </div>
                
                <div className="price-grid-row">
                  <div className="form-group">
                    <label className="form-label">CERTIFIABLE</label>
                    <select
                      className="form-input"
                      value={item['CERTIFIABLE']}
                      onChange={(e) => handlePriceItemChange(item.id, 'CERTIFIABLE', e.target.value)}
                    >
                      <option value="">Sertifika durumu seçin</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Upon Request">Upon Request</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={isGenerating}
          >
            Temizle
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? <span className="spinner"></span> : null}
            {isGenerating ? 'PDF Oluşturuluyor...' : 'PDF Oluştur ve İndir'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PriceOfferForm;
