import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import RecipientManager from './RecipientManager';
import '../css/CreditNoteForm.css';

const CreditNoteForm = ({ selectedLanguage }) => {
  // Sorumlu kişiler listesi
  const responsiblePersons = {
    'NURAN YELMEN': {
      name: 'NURAN YELMEN',
      telephone: '+90 530 285 71 71',
      email: 'NURAN@TUANATEX.COM'
    },
    'CENK YELMEN': {
      name: 'CENK YELMEN',
      telephone: '+39 333 289 46 99', 
      email: 'CENK@TUANATEX.COM'
    }
  };

  const [formData, setFormData] = useState({
    // Credit Note Information
    'INVOICE NUMBER': '',
    'CREDIT NOTE NUMBER': '',
    
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
    
    // Notes
    'Notlar': ''
  });

  // Goods Items - Proforma Invoice ile aynı yapı
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
  const { isGenerating, progress, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manuel giriş durumunu takip etmek için ayrı state
  const [isCustomEntry, setIsCustomEntry] = useState(false);

  // Sorumlu kişi seçimi değiştiğinde çalışan fonksiyon
  const handleResponsiblePersonChange = (selectedPersonName) => {
    const selectedPerson = responsiblePersons[selectedPersonName];
    
    if (selectedPerson) {
      setIsCustomEntry(false);
      setFormData(prev => ({
        ...prev,
        'RESPONSIBLE PERSON': selectedPerson.name,
        'TELEPHONE': selectedPerson.telephone,
        'EMAIL': selectedPerson.email
      }));
    } else if (selectedPersonName === 'custom') {
      setIsCustomEntry(true);
      setFormData(prev => ({
        ...prev,
        'RESPONSIBLE PERSON': '',
        'TELEPHONE': '',
        'EMAIL': ''
      }));
    } else {
      setIsCustomEntry(false);
      setFormData(prev => ({
        ...prev,
        'RESPONSIBLE PERSON': selectedPersonName,
        'TELEPHONE': '',
        'EMAIL': ''
      }));
    }
  };

  // Recipient seçildiğinde çalışan fonksiyon
  const handleRecipientSelect = (recipient) => {
    setFormData(prev => ({
      ...prev,
      'RECIPIENT Şirket Adı': recipient.companyName || '',
      'RECIPIENT Adres': recipient.address || '',
      'RECIPIENT İlçe İl Ülke': recipient.cityStateCountry || '',
      'RECIPIENT Vat': recipient.vat || '',
      'RECIPIENT Sorumlu Kişi': recipient.contactPerson || '',
      'RECIPIENT Telefon': recipient.phone || '',
      'RECIPIENT Email': recipient.email || ''
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

  // Goods verilerini güncelleme
  const handleGoodsChange = (id, field, value) => {
    setGoods(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // PRICE veya QUANTITY değiştiğinde AMOUNT'u otomatik hesapla
        if (field === 'PRICE' || field === 'QUANTITY (METERS)') {
          const price = parseFloat(field === 'PRICE' ? value : updatedItem['PRICE']) || 0;
          const quantity = parseFloat(field === 'QUANTITY (METERS)' ? value : updatedItem['QUANTITY (METERS)']) || 0;
          updatedItem['AMOUNT'] = (price * quantity).toFixed(2);
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Yeni goods item ekleme
  const addGoodsItem = () => {
    const newId = Math.max(...goods.map(item => item.id)) + 1;
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

  // Goods item silme
  const removeGoodsItem = (id) => {
    if (goods.length > 1) {
      setGoods(prev => prev.filter(item => item.id !== id));
    }
  };

  // Toplam tutarı hesaplama
  const calculateTotal = () => {
    return goods.reduce((total, item) => {
      return total + (parseFloat(item['AMOUNT']) || 0);
    }, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Form data ve goods verilerini birleştir
      const combinedData = {
        ...formData,
        goods: goods,
        totalAmount: calculateTotal()
      };
      
      
      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(combinedData, 'credit-note', selectedLanguage);
      
      if (success) {
        setSuccess('Credit Note PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
      'INVOICE NUMBER': '',
      'CREDIT NOTE NUMBER': '',
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
      'Notlar': ''
    });
    
    // Goods listesini de sıfırla
    setGoods([{
      id: 1,
      'ARTICLE NUMBER': '',
      'WEIGHT / WIDHT': '',
      'QUANTITY (METERS)': '',
      'PRICE': '',
      'AMOUNT': ''
    }]);
    
    // Checkbox'ı da sıfırla
    setCopyRecipientToDelivery(false);
    
    // Manuel giriş durumunu da sıfırla
    setIsCustomEntry(false);
    
    setError('');
    setSuccess('');
  };

  return (
    <div className="credit-form-container">
      <div className="credit-form-header">
        <h2>CREDIT NOTE</h2>
        <p>İADE FATURASI BİLGİLERİNİ DOLDURUN</p>
      </div>

      {/* Error & Success Messages */}
      {(error || pdfError) && (
        <div className="alert alert-error">
          {error || pdfError}
        </div>
      )}
      {success && <div className="alert alert-success">{success}</div>}
      
      {/* Progress Message */}
      {progress && (
        <div className="progress-message">
          {progress}
        </div>
      )}

      <form onSubmit={handleSubmit} className="credit-form">
        {/* Credit Note Information Section */}
        <div className="form-section">
          <h3 className="section-title">CREDIT NOTE INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">INVOICE NUMBER</label>
              <input
                type="text"
                className="form-input"
                value={formData['INVOICE NUMBER']}
                onChange={(e) => handleInputChange('INVOICE NUMBER', e.target.value)}
                placeholder="Orijinal fatura numarası"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">CREDIT NOTE NUMBER</label>
              <input
                type="text"
                className="form-input"
                value={formData['CREDIT NOTE NUMBER']}
                onChange={(e) => handleInputChange('CREDIT NOTE NUMBER', e.target.value)}
                placeholder="İade fatura numarası"
                required
              />
            </div>
          </div>
        </div>

        {/* Responsible Person Section */}
        <div className="form-section">
          <h3 className="section-title">RESPONSIBLE PERSON</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">RESPONSIBLE PERSON</label>
              <select
                className="form-input"
                value={isCustomEntry ? 'custom' : formData['RESPONSIBLE PERSON']}
                onChange={(e) => handleResponsiblePersonChange(e.target.value)}
              >
                <option value="">Sorumlu kişi seçin...</option>
                {Object.keys(responsiblePersons).map(personName => (
                  <option key={personName} value={personName}>
                    {personName}
                  </option>
                ))}
                <option value="custom">Diğer (Manuel Giriş)</option>
              </select>
              
              {/* Manuel giriş için text input (sadece "Diğer" seçildiğinde göster) */}
              {isCustomEntry && (
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: '10px' }}
                  placeholder="Sorumlu kişi adını yazın..."
                  value={formData['RESPONSIBLE PERSON']}
                  onChange={(e) => handleInputChange('RESPONSIBLE PERSON', e.target.value)}
                />
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">TELEPHONE</label>
              <input
                type="tel"
                className="form-input"
                value={formData['TELEPHONE']}
                onChange={(e) => handleInputChange('TELEPHONE', e.target.value)}
                placeholder="Telefon numarası"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input
                type="text"
                className="form-input"
                value={formData['EMAIL']}
                onChange={(e) => handleInputChange('EMAIL', e.target.value)}
                placeholder="E-posta adresi"
              />
            </div>
          </div>
        </div>

        {/* Recipient Section */}
        <div className="form-section">
          <h3 className="section-title">RECIPIENT</h3>
          
          {/* Recipient Manager */}
          <RecipientManager 
            onRecipientSelect={handleRecipientSelect}
            selectedRecipient={{
              companyName: formData['RECIPIENT Şirket Adı'],
              address: formData['RECIPIENT Adres'],
              cityStateCountry: formData['RECIPIENT İlçe İl Ülke'],
              vat: formData['RECIPIENT Vat'],
              contactPerson: formData['RECIPIENT Sorumlu Kişi'],
              phone: formData['RECIPIENT Telefon'],
              email: formData['RECIPIENT Email']
            }}
          />
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">RECIPIENT Şirket Adı</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Şirket Adı']}
                onChange={(e) => handleInputChange('RECIPIENT Şirket Adı', e.target.value)}
                placeholder="Alıcı şirket adı"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">RECIPIENT Adres</label>
              <textarea
                className="form-textarea"
                value={formData['RECIPIENT Adres']}
                onChange={(e) => handleInputChange('RECIPIENT Adres', e.target.value)}
                placeholder="Alıcı şirket adresi"
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
                placeholder="İlçe, İl, Ülke"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">RECIPIENT Vat</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Vat']}
                onChange={(e) => handleInputChange('RECIPIENT Vat', e.target.value)}
                placeholder="Vergi numarası"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">RECIPIENT Sorumlu Kişi</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Sorumlu Kişi']}
                onChange={(e) => handleInputChange('RECIPIENT Sorumlu Kişi', e.target.value)}
                placeholder="Alıcı sorumlu kişi"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">RECIPIENT Telefon</label>
              <input
                type="tel"
                className="form-input"
                value={formData['RECIPIENT Telefon']}
                onChange={(e) => handleInputChange('RECIPIENT Telefon', e.target.value)}
                placeholder="Alıcı telefon"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">RECIPIENT Email</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Email']}
                onChange={(e) => handleInputChange('RECIPIENT Email', e.target.value)}
                placeholder="Alıcı e-posta"
              />
            </div>
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="form-section">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 className="section-title">DELIVERY ADDRESS</h3>
            <div className="checkbox-group">
              <label className="checkbox-label" style={{ fontSize: '14px', color: '#666' }}>
                <input
                  type="checkbox"
                  checked={copyRecipientToDelivery}
                  onChange={(e) => handleCopyToDelivery(e.target.checked)}
                />
                <span className="checkmark"></span>
                Alıcı bilgilerini teslimat adresine kopyala
              </label>
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Şirket Adı</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Şirket Adı']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Şirket Adı', e.target.value)}
                placeholder="Teslimat şirket adı"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Adres</label>
              <textarea
                className="form-textarea"
                value={formData['DELIVERY ADDRESS Adres']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Adres', e.target.value)}
                placeholder="Teslimat adresi"
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
                placeholder="İlçe, İl, Ülke"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Vat</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Vat']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Vat', e.target.value)}
                placeholder="Teslimat vergi numarası"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Sorumlu Kişi</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Sorumlu Kişi']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Sorumlu Kişi', e.target.value)}
                placeholder="Teslimat sorumlu kişi"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Telefon</label>
              <input
                type="tel"
                className="form-input"
                value={formData['DELIVERY ADDRESS Telefon']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Telefon', e.target.value)}
                placeholder="Teslimat telefon"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Email</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Email']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Email', e.target.value)}
                placeholder="Teslimat e-posta"
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

  {/* Select Menü */}
  <select
    className="form-input"
    value={formData['Payment Terms']}
    onChange={(e) => handleInputChange('Payment Terms', e.target.value)}
  >
    <option value="">Ödeme vadesi seçin</option>
    <option value=" DAYS">--Düzenlenebilir-- </option>
    <option value="30 DAYS">30 DAYS</option>
    <option value="60 DAYS">60 DAYS</option>
    <option value="90 DAYS">90 DAYS</option>
    <option value="120 DAYS">120 DAYS</option>
    <option value="150 DAYS">150 DAYS</option>
    <option value="180 DAYS">180 DAYS</option>
    <option value="IMMEDIATELY">IMMEDIATELY</option>
    <option value="CASH IN ADVANCE">CASH IN ADVANCE</option>
  </select>

  {/* Seçilen değer düzenlenebilir input */}
  {formData["Payment Terms"] !== "" && (
    <input
      type="text"
      className="form-input"
      style={{ marginTop: "8px" }}
      value={formData["Payment Terms"]}
      onChange={(e) => handleInputChange("Payment Terms", e.target.value)}
      placeholder="Ödeme vadesini düzenle"
    />
  )}
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
          </div>
        </div>

        {/* Notes Section */}
        <div className="form-section">
          <h3 className="section-title">NOTLAR</h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notlar</label>
              <textarea
                className="form-textarea"
                value={formData['Notlar']}
                onChange={(e) => handleInputChange('Notlar', e.target.value)}
                placeholder="Buraya notlarınızı yazabilirsiniz..."
                rows="6"
              />
            </div>
          </div>
        </div>

        {/* Goods Section */}
        <div className="form-section">
          <div className="goods-header">
            <h3 className="section-title">GOODS DETAILS</h3>
            <button
              type="button"
              className="btn btn-add-goods"
              onClick={addGoodsItem}
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
                    onClick={() => removeGoodsItem(item.id)}
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
                      type="text"
                      className="form-input"
                      value={item['QUANTITY (METERS)']}
                      onChange={(e) => handleGoodsChange(item.id, 'QUANTITY (METERS)', e.target.value)}
                      placeholder="Miktar (metre)"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">PRICE</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['PRICE']}
                      onChange={(e) => handleGoodsChange(item.id, 'PRICE', e.target.value)}
                      placeholder="Birim fiyat"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">AMOUNT</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={item['AMOUNT']}
                        readOnly
                        placeholder="Toplam tutar"
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
          
          {/* Total Amount Display */}
          <div className="total-section">
            <div className="total-amount">
              <strong>Toplam Tutar: {calculateTotal()}</strong>
            </div>
          </div>
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

        {/* Loading Spinner */}
        {isGenerating && (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreditNoteForm;
