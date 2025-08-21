import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import '../css/OrderConfirmationForm.css';

const OrderConfirmationForm = ({ selectedLanguage }) => {
  const [formData, setFormData] = useState({
    // Order Confirmation specific field
    'ORDER CONFIRMATION NUMBER': '',
    
    // Responsible Person
    'RESPONSIBLE PERSON': '',
    'TELEPHONE': '',
    'EMAIL': '',
    
    // Recipient
    'RECIPIENT Şirket Adı': '',
    'RECIPIENT Adres': '',
    'RECIPIENT İlçe İl Ülke': '',
    'RECIPIENT Vat': '',
    'RECIPIENT Sorumlu Kişi': '',
    'RECIPIENT Telefon': '',
    'RECIPIENT Email': '',
    
    // Delivery Address
    'DELIVERY ADDRESS Şirket Adı': '',
    'DELIVERY ADDRESS Adres': '',
    'DELIVERY ADDRESS İlçe İl Ülke': '',
    'DELIVERY ADDRESS Vat': '',
    'DELIVERY ADDRESS Sorumlu Kişi': '',
    'DELIVERY ADDRESS Telefon': '',
    'DELIVERY ADDRESS Email': '',
    
    // Payment & Shipping Details
    'Payment Terms': '',
    'Transport Type': '',
    'Country of Origin': '',
    'Gross Weight': '',
    'Net Weight': '',
    'Rolls': '',
    'Lead Time': '',
    
  });

  // Description of Goods - Ürün listesi
  const [goods, setGoods] = useState([
    {
      id: 1,
      'ARTICLE NUMBER': '',
      'WEIGHT / WIDHT': '',
      'QUANTITY (METERS)': '',
      'PRICE': '',
      'AMOUNT': '',
      'CURRENCY': 'EUR'
    }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // RECIPIENT bilgilerini DELIVERY ADDRESS'e kopyalama için state
  const [copyRecipientToDelivery, setCopyRecipientToDelivery] = useState(false);

  // Yeni PDF generation hook'u
  const { isGenerating, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // RECIPIENT bilgilerini DELIVERY ADDRESS'e kopyalama fonksiyonu
  const handleCopyToDelivery = (isChecked) => {
    setCopyRecipientToDelivery(isChecked);
    
    if (isChecked) {
      setFormData(prev => ({
        ...prev,
        'DELIVERY ADDRESS Şirket Adı': prev['RECIPIENT Şirket Adı'],
        'DELIVERY ADDRESS Adres': prev['RECIPIENT Adres'],
        'DELIVERY ADDRESS İlçe İl Ülke': prev['RECIPIENT İlçe İl Ülke'],
        'DELIVERY ADDRESS Vat': prev['RECIPIENT Vat'],
        'DELIVERY ADDRESS Sorumlu Kişi': prev['RECIPIENT Sorumlu Kişi'],
        'DELIVERY ADDRESS Telefon': prev['RECIPIENT Telefon'],
        'DELIVERY ADDRESS Email': prev['RECIPIENT Email']
      }));
    }
  };

  // Ürün verilerini güncelleme
  const handleGoodsChange = (id, field, value) => {
    setGoods(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // QUANTITY veya PRICE değiştiğinde AMOUNT'u otomatik hesapla
        if (field === 'QUANTITY (METERS)' || field === 'PRICE') {
          const quantity = parseFloat(field === 'QUANTITY (METERS)' ? value : updatedItem['QUANTITY (METERS)']) || 0;
          const price = parseFloat(field === 'PRICE' ? value : updatedItem['PRICE']) || 0;
          
          // Miktar ve fiyat varsa çarpma işlemi yap
          if (quantity > 0 && price > 0) {
            updatedItem['AMOUNT'] = (quantity * price).toFixed(2);
          } else {
            updatedItem['AMOUNT'] = '';
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Yeni ürün ekleme
  const addGoods = () => {
    const newId = Math.max(...goods.map(g => g.id)) + 1;
    setGoods(prev => [...prev, {
      id: newId,
      'ARTICLE NUMBER': '',
      'WEIGHT / WIDHT': '',
      'QUANTITY (METERS)': '',
      'PRICE': '',
      'AMOUNT': '',
      'CURRENCY': 'EUR'
    }]);
  };

  // Ürün silme
  const removeGoods = (id) => {
    if (goods.length > 1) {
      setGoods(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Form data ve goods verilerini birleştir
      const combinedData = {
        ...formData,
        goods: goods
      };
      
      console.log('Gönderilen order confirmation data:', combinedData);
      
      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(combinedData, 'order-confirmation', selectedLanguage);
      
      if (success) {
        setSuccess('Order Confirmation PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
      'ORDER CONFIRMATION NUMBER': '',
      'RESPONSIBLE PERSON': '',
      'TELEPHONE': '',
      'EMAIL': '',
      'RECIPIENT Şirket Adı': '',
      'RECIPIENT Adres': '',
      'RECIPIENT İlçe İl Ülke': '',
      'RECIPIENT Vat': '',
      'RECIPIENT Sorumlu Kişi': '',
      'RECIPIENT Telefon': '',
      'RECIPIENT Email': '',
      'DELIVERY ADDRESS Şirket Adı': '',
      'DELIVERY ADDRESS Adres': '',
      'DELIVERY ADDRESS İlçe İl Ülke': '',
      'DELIVERY ADDRESS Vat': '',
      'DELIVERY ADDRESS Sorumlu Kişi': '',
      'DELIVERY ADDRESS Telefon': '',
      'DELIVERY ADDRESS Email': '',
      'Payment Terms': '',
      'Transport Type': '',
      'Country of Origin': '',
      'Gross Weight': '',
      'Net Weight': '',
      'Rolls': '',
      'Lead Time': '',
    });
    
    setGoods([{
      id: 1,
      'ARTICLE NUMBER': '',
      'WEIGHT / WIDTH': '',
      'QUANTITY (METERS)': '',
      'PRICE': '',
      'AMOUNT': ''
    }]);
    
    // Checkbox'ı da sıfırla
    setCopyRecipientToDelivery(false);
    
    setError('');
    setSuccess('');
  };

  return (
    <div className="order-confirmation-form-container">
      <div className="order-confirmation-form-header">
        <h2>ORDER CONFIRMATION</h2>
        <p>Sipariş onay belgesi oluşturun</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {pdfError && <div className="alert alert-error">{pdfError}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="order-confirmation-form" onSubmit={handleSubmit}>
        
        {/* Order Confirmation Number */}
        <div className="form-section">
          <h3 className="section-title">Order Confirmation Details</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">ORDER CONFIRMATION NUMBER *</label>
              <input
                type="text"
                className="form-input"
                value={formData['ORDER CONFIRMATION NUMBER']}
                onChange={(e) => handleInputChange('ORDER CONFIRMATION NUMBER', e.target.value)}
                required
                placeholder="Sipariş onay numarasını girin"
              />
            </div>
          </div>
        </div>

        {/* Responsible Person */}
        <div className="form-section">
          <h3 className="section-title">Responsible Person</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">RESPONSIBLE PERSON</label>
              <input
                type="text"
                className="form-input"
                value={formData['RESPONSIBLE PERSON']}
                onChange={(e) => handleInputChange('RESPONSIBLE PERSON', e.target.value)}
                placeholder="Sorumlu kişi adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">TELEPHONE</label>
              <input
                type="text"
                className="form-input"
                value={formData['TELEPHONE']}
                onChange={(e) => handleInputChange('TELEPHONE', e.target.value)}
                placeholder="Telefon numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input
                type="email"
                className="form-input"
                value={formData['EMAIL']}
                onChange={(e) => handleInputChange('EMAIL', e.target.value)}
                placeholder="E-mail adresini girin"
              />
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="form-section">
          <h3 className="section-title">Recipient Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">RECIPIENT Şirket Adı</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Şirket Adı']}
                onChange={(e) => handleInputChange('RECIPIENT Şirket Adı', e.target.value)}
                placeholder="Alıcı şirket adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Adres</label>
              <textarea
                className="form-textarea"
                value={formData['RECIPIENT Adres']}
                onChange={(e) => handleInputChange('RECIPIENT Adres', e.target.value)}
                placeholder="Alıcı adresini girin"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT İlçe İl Ülke</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT İlçe İl Ülke']}
                onChange={(e) => handleInputChange('RECIPIENT İlçe İl Ülke', e.target.value)}
                placeholder="İlçe, İl, Ülke bilgisini girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Vat</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Vat']}
                onChange={(e) => handleInputChange('RECIPIENT Vat', e.target.value)}
                placeholder="Vergi numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Sorumlu Kişi</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Sorumlu Kişi']}
                onChange={(e) => handleInputChange('RECIPIENT Sorumlu Kişi', e.target.value)}
                placeholder="Alıcı sorumlu kişi adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Telefon</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Telefon']}
                onChange={(e) => handleInputChange('RECIPIENT Telefon', e.target.value)}
                placeholder="Alıcı telefon numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Email</label>
              <input
                type="email"
                className="form-input"
                value={formData['RECIPIENT Email']}
                onChange={(e) => handleInputChange('RECIPIENT Email', e.target.value)}
                placeholder="Alıcı e-mail adresini girin"
              />
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Delivery Address</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', color: '#666' }}>
              <input
                type="checkbox"
                checked={copyRecipientToDelivery}
                onChange={(e) => handleCopyToDelivery(e.target.checked)}
                style={{ margin: 0 }}
              />
              RECIPIENT bilgilerini kopyala
            </label>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Şirket Adı</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Şirket Adı']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Şirket Adı', e.target.value)}
                placeholder="Teslimat şirket adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Adres</label>
              <textarea
                className="form-textarea"
                value={formData['DELIVERY ADDRESS Adres']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Adres', e.target.value)}
                placeholder="Teslimat adresini girin"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS İlçe İl Ülke</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS İlçe İl Ülke']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS İlçe İl Ülke', e.target.value)}
                placeholder="Teslimat İlçe, İl, Ülke bilgisini girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Vat</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Vat']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Vat', e.target.value)}
                placeholder="Teslimat vergi numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Sorumlu Kişi</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Sorumlu Kişi']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Sorumlu Kişi', e.target.value)}
                placeholder="Teslimat sorumlu kişi adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Telefon</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Telefon']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Telefon', e.target.value)}
                placeholder="Teslimat telefon numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Email</label>
              <input
                type="email"
                className="form-input"
                value={formData['DELIVERY ADDRESS Email']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Email', e.target.value)}
                placeholder="Teslimat e-mail adresini girin"
              />
            </div>
          </div>
        </div>

    {/* Payment & Shipping Details Section */}
        <div className="form-section">
          <h3 className="section-title">PAYMENT & SHIPPING DETAILS</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select
                className="form-input"
                value={formData['Payment Terms']}
                onChange={(e) => handleInputChange('Payment Terms', e.target.value)}
              >
                <option value="">Ödeme vadesi seçin</option>
                <option value="30 Days">30 Days</option>
                <option value="60 Days">60 Days</option>
                <option value="90 Days">90 Days</option>
                <option value="120 Days">120 Days</option>
                <option value="150 Days">150 Days</option>
                <option value="180 Days">180 Days</option>
                <option value="Immediately">Immediately</option>
                <option value="Cash in Advance">Cash in Advance</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Transport Type</label>
              <select
                className="form-input"
                value={formData['Transport Type']}
                onChange={(e) => handleInputChange('Transport Type', e.target.value)}
              >
                <option value="">Taşıma türü seçin</option>
                <option value="CIF">CIF</option>
                <option value="FOB">FOB</option>
                <option value="EXW">EXW</option>
                <option value="DAP">DAP</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Country of Origin</label>
              <input
                type="text"
                className="form-input"
                value={formData['Country of Origin']}
                onChange={(e) => handleInputChange('Country of Origin', e.target.value)}
                placeholder="Menşei ülke"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gross Weight</label>
              <input
                type="text"
                className="form-input"
                value={formData['Gross Weight']}
                onChange={(e) => handleInputChange('Gross Weight', e.target.value)}
                placeholder="Brüt ağırlık"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Net Weight</label>
              <input
                type="text"
                className="form-input"
                value={formData['Net Weight']}
                onChange={(e) => handleInputChange('Net Weight', e.target.value)}
                placeholder="Net ağırlık"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Rolls</label>
              <input
                type="text"
                className="form-input"
                value={formData['Rolls']}
                onChange={(e) => handleInputChange('Rolls', e.target.value)}
                placeholder="Top sayısı"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Time</label>
              <input
                type="text"
                className="form-input"
                value={formData['Lead Time']}
                onChange={(e) => handleInputChange('Lead Time', e.target.value)}
                placeholder="Teslim süresi"
              />
            </div>
          </div>
        </div>

        {/* Description of Goods Section */}
        <div className="form-section">
          <div className="goods-header">
            <h3 className="section-title">DESCRIPTION OF GOODS</h3>
            <button
              type="button"
              className="btn btn-add-goods"
              onClick={addGoods}
            >
              + Yeni Ürün Ekle
            </button>
          </div>
          
          {goods.map((item, index) => (
            <div key={item.id} className="goods-item">
              <div className="goods-item-header">
                <h4 className="goods-item-title">Ürün #{index + 1}</h4>
                {goods.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-remove-goods"
                    onClick={() => removeGoods(item.id)}
                  >
                    × Sil
                  </button>
                )}
              </div>
              
              <div className="goods-container">
                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">ARTICLE NUMBER</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['ARTICLE NUMBER']}
                      onChange={(e) => handleGoodsChange(item.id, 'ARTICLE NUMBER', e.target.value)}
                      placeholder="Ürün numarası"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">WEIGHT / WIDHT</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['WEIGHT / WIDHT']}
                      onChange={(e) => handleGoodsChange(item.id, 'WEIGHT / WIDHT', e.target.value)}
                      placeholder="Ağırlık / Genişlik"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">QUANTITY (METERS)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={item['QUANTITY (METERS)']}
                      onChange={(e) => handleGoodsChange(item.id, 'QUANTITY (METERS)', e.target.value)}
                      placeholder="Miktar (metre)"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">PRICE</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['PRICE']}
                      onChange={(e) => handleGoodsChange(item.id, 'PRICE', e.target.value)}
                      placeholder="Birim fiyat (USD/EUR) Belirtiniz"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">AMOUNT</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={item['AMOUNT']}
                        onChange={(e) => handleGoodsChange(item.id, 'AMOUNT', e.target.value)}
                        placeholder="Toplam tutar (otom. hesaplanır)"
                        readOnly
                        style={{ backgroundColor: '#f8f9fa', cursor: 'default', flex: '1' }}
                      />
                      <select
                        className="form-input"
                        value={item['CURRENCY']}
                        onChange={(e) => handleGoodsChange(item.id, 'CURRENCY', e.target.value)}
                        style={{ width: '80px', flex: '0 0 80px' }}
                      >
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                        <option value="TRY">TRY</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isGenerating}
          >
            Temizle
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                PDF Oluşturuluyor...
              </>
            ) : (
              'PDF Oluştur ve İndir'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderConfirmationForm;
