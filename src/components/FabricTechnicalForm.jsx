import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import RecipientManager from './RecipientManager';
import '../css/HangersShipmentForm.css';

const HangersShipmentForm = ({ selectedLanguage }) => {
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
    // Hangers Shipment specific fields
    'TRACKING CODE': '',
    'COURIER': '',
    
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
    
    // Notes
    'NOTLAR': '',
    
    // Transport & Origin Details
    'TRANSPORT TYPE': '',
    'COUNTRY OF ORIGIN': '',
  });

  // Hangers Items - Özel ürün listesi yapısı
  const [hangersItems, setHangersItems] = useState([
    {
      id: 1,
      'ARTICLE NUMBER': '',
      'TYPE': '',
      'COMPOSITION': '',
      'HANGER DIMENSION': '',
      'PIECES': '',
      'HS (CUSTOMS) CODE': ''
    }
  ]);
  // Kargo şirketi manuel giriş durumu
const [isCustomCourier, setIsCustomCourier] = useState(false);

// Değişim fonksiyonu
const handleCourierChange = (value) => {
  if (value === 'custom') {
    setIsCustomCourier(true);
    handleInputChange('COURIER', '');
  } else {
    setIsCustomCourier(false);
    handleInputChange('COURIER', value);
  }
};


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

  // Hangers items verilerini güncelleme
  const handleHangersItemChange = (id, field, value) => {
    setHangersItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Yeni hangers item ekleme
  const addHangersItem = () => {
    const newId = Math.max(...hangersItems.map(item => item.id)) + 1;
    setHangersItems(prev => [...prev, {
      id: newId,
      'ARTICLE NUMBER': '',
      'TYPE': '',
      'COMPOSITION': '',
      'HANGER DIMENSION': '',
      'PIECES': '',
      'HS (CUSTOMS) CODE': ''
    }]);
  };

  // Hangers item silme
  const removeHangersItem = (id) => {
    if (hangersItems.length > 1) {
      setHangersItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Form data ve hangers items verilerini birleştir
      const combinedData = {
        ...formData,
        hangersItems: hangersItems
      };
      
      console.log('Gönderilen hangers shipment data:', combinedData);
      
      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(combinedData, 'hangers-shipment', selectedLanguage);
      
      if (success) {
        setSuccess('Hangers Shipment Details Sheet PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
      'TRACKING CODE': '',
      'COURIER': '',
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
      'NOTLAR': '',
      'TRANSPORT TYPE': '',
      'COUNTRY OF ORIGIN': '',
    });
    
    // Hangers items listesini de sıfırla
    setHangersItems([{
      id: 1,
      'ARTICLE NUMBER': '',
      'TYPE': '',
      'COMPOSITION': '',
      'HANGER DIMENSION': '',
      'PIECES': '',
      'HS (CUSTOMS) CODE': ''
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
        <h2>HANGERS SHIPMENT DETAILS SHEET</h2>
        <p>Askı gönderim detay bilgilerini doldurun</p>
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

      <form onSubmit={handleSubmit} className="proforma-form">
        {/* Tracking & Courier Information Section */}
        <div className="form-section">
          <h3 className="section-title">TRACKING & COURIER INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">TRACKING CODE</label>
              <input
                type="text"
                className="form-input"
                value={formData['TRACKING CODE']}
                onChange={(e) => handleInputChange('TRACKING CODE', e.target.value)}
                placeholder="Takip kodu"
                required
              />
            </div>
            

    <div className="form-group">
      <label className="form-label">COURIER</label>
      <select
        className="form-input"
        value={isCustomCourier ? 'custom' : formData['COURIER']}
        onChange={(e) => handleCourierChange(e.target.value)}
        required
      >
        <option value="">Kargo şirketi seçin...</option>
        <option value="FEDEX">FEDEX</option>
        <option value="TNT">TNT</option>
        <option value="UPS">UPS</option>
        <option value="DHL">DHL</option>
        <option value="PTS">PTS</option>
        <option value="custom">Diğer (Manuel Giriş)</option>
      </select>

      {/* Manuel giriş sadece “Diğer” seçilince görünsün */}
      {isCustomCourier && (
        <input
          type="text"
          className="form-input"
          style={{ marginTop: '10px' }}
          placeholder="Kargo şirketi adını yazın..."
          value={formData['COURIER']}
          onChange={(e) => handleInputChange('COURIER', e.target.value)}
        />
      )}
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

        {/* Notes Section */}
        <div className="form-section">
          <h3 className="section-title">NOTLAR</h3>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Notlar</label>
              <textarea
                className="form-textarea"
                value={formData['NOTLAR']}
                onChange={(e) => handleInputChange('NOTLAR', e.target.value)}
                placeholder="Buraya notlarınızı yazabilirsiniz..."
                rows="6"
              />
            </div>
          </div>
        </div>

        {/* Transport & Origin Details Section */}
        <div className="form-section">
          <h3 className="section-title">TRANSPORT & ORIGIN DETAILS</h3>
          <div className="form-grid">
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
                <option value="DDP">DDP</option>
                <option value="FCA">FCA</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">COUNTRY OF ORIGIN</label>
              <input
                type="text"
                className="form-input"
                value={formData['COUNTRY OF ORIGIN']}
                onChange={(e) => handleInputChange('COUNTRY OF ORIGIN', e.target.value)}
                placeholder="Menşei ülke"
              />
            </div>
          </div>
        </div>
           {/* Hangers Items Section */}
        <div className="form-section">
          <div className="goods-header">
            <h3 className="section-title">HANGERS DETAILS</h3>
            <button
              type="button"
              className="btn btn-add-goods"
              onClick={addHangersItem}
            >
              + Yeni Ürün Ekle
            </button>
          </div>
          
          {hangersItems.map((item, index) => (
            <div key={item.id} className="goods-item">
              <div className="goods-item-header">
                <h4 className="goods-item-title">Ürün #{index + 1}</h4>
                {hangersItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-remove-goods"
                    onClick={() => removeHangersItem(item.id)}
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
                      onChange={(e) => handleHangersItemChange(item.id, 'ARTICLE NUMBER', e.target.value)}
                      placeholder="Artikel numarası"
                    />
                  </div>
                  
                 <div className="form-group">
         <label className="form-label">TYPE</label>
       <select
      className="form-input"
      value={item['TYPE']}
      onChange={(e) => handleHangersItemChange(item.id, 'TYPE', e.target.value)}
       >
      <option value="">Seçiniz</option>
       <option value="KNIT">KNIT</option>
       <option value="WOVEN">WOVEN</option>
     </select>
      </div>

                  
                  <div className="form-group">
                    <label className="form-label">COMPOSITION</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['COMPOSITION']}
                      onChange={(e) => handleHangersItemChange(item.id, 'COMPOSITION', e.target.value)}
                      placeholder="Kompozisyon"
                    />
                  </div>
                </div>
                
                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">HANGER DIMENSION</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['HANGER DIMENSION']}
                      onChange={(e) => handleHangersItemChange(item.id, 'HANGER DIMENSION', e.target.value)}
                      placeholder="Askı ölçüleri"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">PIECES</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['PIECES']}
                      onChange={(e) => handleHangersItemChange(item.id, 'PIECES', e.target.value)}
                      placeholder="Adet"
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">HS (CUSTOMS) CODE</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['HS (CUSTOMS) CODE']}
                      onChange={(e) => handleHangersItemChange(item.id, 'HS (CUSTOMS) CODE', e.target.value)}
                      placeholder="Gümrük kodu"
                    />
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
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default HangersShipmentForm;