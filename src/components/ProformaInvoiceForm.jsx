import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import SystemStatus from './SystemStatus';
import RecipientManager from './RecipientManager';
import '../css/ProformaInvoiceForm.css';

const ProformaInvoiceForm = ({ selectedLanguage }) => {
  // Sorumlu kişiler listesi
  const responsiblePersons = {
    'NURAN YELMEN': {
      name: 'NURAN YELMEN',
      telephone: '+90 530 285 71 71',
      email: 'NURAN@TUANATEX.COM'
    },
    'CENK YELMEN': {
      name: 'CENK YELMEN',
      telephone: '+90 333 234 45 38', 
      email: 'CENK@TUANATEX.COM'
    }
  };

  const [formData, setFormData] = useState({
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
    
    // Financial Information
    'Kur Bilgisi Enabled': false,
    'Kur Bilgisi': '',
    'KDV Ekle Enabled': false,
    'KDV': '',
    'Discount Enabled': false,
    'Discount': '',
    'Banka Bilgileri': '',
    
    // Payment & Shipping Details
    'Payment Terms': '',
    'Transport Type': '',
    'Country of Origin': '',
    'Gross Weight': '',
    'Net Weight': '',
    'Rolls': '',
    
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

  // Checkbox değiştiğinde çalışan fonksiyon
  const handleCopyToDelivery = (checked) => {
    setCopyRecipientToDelivery(checked);
    
    if (checked) {
      // Checkbox işaretlendiğinde RECIPIENT verilerini DELIVERY ADDRESS'e kopyala
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

  // Banka bilgilerini getir
  const getBankInfo = (currency) => {
    const bankInfos = {
      'TRY': `BANKA : TEB (TÜRKIYE EKONOMI BANKASI )
ŞUBE: MERTER(032)
HESAP NO: 962246
IBAN :TR78 0003 2000 0320 0000 9622 46`,
      'USD': `BANKA : TEB (TÜRKIYE EKONOMI BANKASI )
BRANCH: MERTER(032)
ACCOUNT NO: 967978
SWİFT: TEBUTRIS 032
IBAN :TR29 0003 2000 0320 0000 9679 78`,
      'EUR': `BANKA : TEB (TÜRKIYE EKONOMI BANKASI )
BRANCH: MERTER(032)
ACCOUNT NO: 967979
SWİFT: TEBUTRIS 032
IBAN :TR02 0003 2000 0320 0000 9679 79`
    };
    return bankInfos[currency] || '';
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
      
      console.log('Gönderilen form data:', combinedData);
      
      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(combinedData, 'proforma-invoice', selectedLanguage);
      
      if (success) {
        setSuccess('Proforma Invoice PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
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
      'DELIVERY ADDRESS İlçe İL Ülke': '',
      'DELIVERY ADDRESS Vat': '',
      'DELIVERY ADDRESS Sorumlu Kişi': '',
      'DELIVERY ADDRESS Telefon': '',
      'DELIVERY ADDRESS Email': '',
      'Kur Bilgisi Enabled': false,
      'Kur Bilgisi': '',
      'KDV Ekle Enabled': false,
      'KDV': '',
      'Discount Enabled': false,
      'Discount': '',
      'Banka Bilgileri': '',
      'Notlar': '',
      'Payment Terms': '',
      'Transport Type': '',
      'Country of Origin': '',
      'Gross Weight': '',
      'Net Weight': '',
      'Rolls': ''
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
    <div className="proforma-form-container">
      <div className="proforma-form-header">
        <h2>PROFORMA INVOICE</h2>
        <p>PROFORMA FATURA BİLGİLERİNİ DOLDURUN</p>
      </div>

      {/* Sistem Durumu */}
      <SystemStatus />

      {/* Error & Success Messages */}
      {(error || pdfError) && (
        <div className="alert alert-error">
          {error || pdfError}
        </div>
      )}
      {success && <div className="alert alert-success">{success}</div>}
      
      {/* Progress Message */}
      {progress && (
        <div className="progress-message" style={{ 
          background: '#e3f2fd', 
          border: '1px solid #2196f3', 
          color: '#1976d2', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {progress}
        </div>
      )}

      <form onSubmit={handleSubmit} className="proforma-form">
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
                type="email"
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
              'RECIPIENT Şirket Adı': formData['RECIPIENT Şirket Adı'],
              'RECIPIENT Adres': formData['RECIPIENT Adres'],
              'RECIPIENT İlçe İl Ülke': formData['RECIPIENT İlçe İl Ülke'],
              'RECIPIENT Vat': formData['RECIPIENT Vat'],
              'RECIPIENT Sorumlu Kişi': formData['RECIPIENT Sorumlu Kişi'],
              'RECIPIENT Telefon': formData['RECIPIENT Telefon'],
              'RECIPIENT Email': formData['RECIPIENT Email']
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
                type="email"
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
                type="email"
                className="form-input"
                value={formData['DELIVERY ADDRESS Email']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Email', e.target.value)}
                placeholder="Teslimat e-posta"
              />
            </div>
          </div>
        </div>

        {/* Financial Information Section */}
        <div className="form-section">
          <h3 className="section-title">FINANCIAL INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData['Kur Bilgisi Enabled']}
                    onChange={(e) => handleInputChange('Kur Bilgisi Enabled', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Kur Bilgisi
                </label>
              </div>
              {formData['Kur Bilgisi Enabled'] && (
                <input
                  type="text"
                  className="form-input"
                  value={formData['Kur Bilgisi']}
                  onChange={(e) => handleInputChange('Kur Bilgisi', e.target.value)}
                  placeholder="Kur bilgisi girin"
                  style={{ marginTop: '10px' }}
                />
              )}
            </div>
            
            <div className="form-group">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData['KDV Ekle Enabled']}
                    onChange={(e) => handleInputChange('KDV Ekle Enabled', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  KDV Ekle
                </label>
              </div>
              {formData['KDV Ekle Enabled'] && (
                <input
                  type="text"
                  className="form-input"
                  value={formData['KDV']}
                  onChange={(e) => handleInputChange('KDV', e.target.value)}
                  placeholder="KDV değeri girin"
                  style={{ marginTop: '10px' }}
                />
              )}
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData['Discount Enabled']}
                    onChange={(e) => handleInputChange('Discount Enabled', e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Discount
                </label>
              </div>
              {formData['Discount Enabled'] && (
                <input
                  type="text"
                  className="form-input"
                  value={formData['Discount']}
                  onChange={(e) => handleInputChange('Discount', e.target.value)}
                  placeholder="İndirim miktarı girin"
                  style={{ marginTop: '10px' }}
                />
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Banka Bilgileri</label>
              <select
                className="form-input"
                value={formData['Banka Bilgileri']}
                onChange={(e) => handleInputChange('Banka Bilgileri', e.target.value)}
              >
                <option value="">Para birimi seçin</option>
                <option value="TRY">TRY (Türk Lirası)</option>
                <option value="USD">USD (Amerikan Doları)</option>
                <option value="EUR">EUR (Euro)</option>
              </select>
            </div>
            
            {formData['Banka Bilgileri'] && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Banka Hesap Bilgileri</label>
                <textarea
                  className="form-textarea"
                  value={getBankInfo(formData['Banka Bilgileri'])}
                  readOnly
                  rows="6"
                  style={{ backgroundColor: '#f8f9fa', cursor: 'default' }}
                />
              </div>
            )}
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
                      type="text"
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
          <div className="loading-spinner" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1rem'
          }}>
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 2s linear infinite'
            }}></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ProformaInvoiceForm;
