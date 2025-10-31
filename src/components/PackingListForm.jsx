import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import RecipientManager from './RecipientManager';
import '../css/PackingListForm.css';

const PackingListForm = ({ selectedLanguage }) => {
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
    // Invoice Information
    'INVOICE NUMBER': '',
    
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
    
  });

  // Packing List Items - Farklı tablo yapısı
  const [packingItems, setPackingItems] = useState([
    {
      id: 1,
      'ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE': '                /                      / ',
      'FABRIC WEIGHT / WIDHT': '',
      'QUANTITY (METERS)': '',
      'ROLL NUMBER ROLL DIMENSIONS': '',
      'LOT': '',
      'GROSS WEIGHT(KG)': '',
      'NET WEIGHT (KG)': ''
    }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  
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


  // Packing items verilerini güncelleme
  const handlePackingItemChange = (id, field, value) => {
    setPackingItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // Yeni packing item ekleme
  const addPackingItem = () => {
    const newId = Math.max(...packingItems.map(item => item.id)) + 1;
    setPackingItems(prev => [...prev, {
      id: newId,
      'ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE': '                /                      / ',
      'FABRIC WEIGHT / WIDHT': '',
      'QUANTITY (METERS)': '',
      'ROLL NUMBER ROLL DIMENSIONS': '',
      'LOT': '',
      'GROSS WEIGHT(KG)': '',
      'NET WEIGHT (KG)': ''
    }]);
  };

  // Packing item silme
  const removePackingItem = (id) => {
    if (packingItems.length > 1) {
      setPackingItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Ürün etiketleri oluşturma fonksiyonu
  const handleCreateProductLabels = async () => {
    setIsGeneratingLabels(true);
    setError('');
    setSuccess('');

    try {
      // Validation: En az bir ürün var mı kontrol et
      if (!packingItems || packingItems.length === 0) {
        throw new Error('Etiket oluşturmak için en az bir ürün eklemelisiniz.');
      }

      // Validation: Boş article number kontrolü
      const emptyItems = packingItems.filter(item => 
        !item['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'] || 
        item['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'].trim() === '' ||
        item['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'].trim() === '                /                      /'
      );

      if (emptyItems.length > 0) {
        throw new Error('Tüm ürünler için Article Number / Composition / Customs Code bilgisi doldurulmalıdır.');
      }

      // Packing items'ları API için uygun formata çevir
      const labelData = {
        items: packingItems.map(item => ({
          articleNumber: item['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE'],
          fabricWeight: item['FABRIC WEIGHT / WIDHT'],
          quantity: item['QUANTITY (METERS)'],
          rollNumber: item['ROLL NUMBER ROLL DIMENSIONS'],
          lot: item['LOT'],
          grossWeight: item['GROSS WEIGHT(KG)'],
          netWeight: item['NET WEIGHT (KG)']
        })),
        companyInfo: {
          responsiblePerson: formData['RESPONSIBLE PERSON'],
          telephone: formData['TELEPHONE'],
          email: formData['EMAIL']
        },
        // CLIENT - InvoiceTemplate'deki gibi aynı formData alanını kullan
        client: {
          companyName: formData['RECIPIENT Şirket Adı'] || formData.recipientCompany || '',
          address: formData['RECIPIENT Adres'] || formData.recipientAddress || '',
          cityStateCountry: formData['RECIPIENT İlçe İl Ülke'] || formData.recipientCityStateCountry || '',
          vat: formData['RECIPIENT Vat'] || formData.recipientVat || '',
          contactPerson: formData['RECIPIENT Sorumlu Kişi'] || formData.recipientContactPerson || '',
          phone: formData['RECIPIENT Telefon'] || formData.recipientPhone || '',
          email: formData['RECIPIENT Email'] || formData.recipientEmail || ''
        },
        invoiceNumber: formData['INVOICE NUMBER']
      };

      console.log('Etiket verileri gönderiliyor:', labelData);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/pdf/generate-product-label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labelData)
      });

      if (!response.ok) {
        // Server'dan dönen hata mesajını almaya çalış
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage += ` - ${errorData.error}`;
          }
          if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
          console.error('Server error details:', errorData);
        } catch (e) {
          // JSON parse edilemezse sadece status code'u göster
          console.error('Could not parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      // PDF blob'unu al
      const blob = await response.blob();
      
      // Dosyayı otomatik indir
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-labels-${formData['INVOICE NUMBER'] || 'unnamed'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('Ürün etiketleri başarıyla oluşturuldu ve indirildi!');
      
    } catch (error) {
      console.error('Etiket oluşturma hatası:', error);
      setError('Ürün etiketleri oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    } finally {
      setIsGeneratingLabels(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Form data ve packing items verilerini birleştir
      const combinedData = {
        ...formData,
        packingItems: packingItems
      };
      
      console.log('Gönderilen packing list data:', combinedData);
      
      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(combinedData, 'packing-list', selectedLanguage);
      
      if (success) {
        setSuccess('Packing List PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
      'INVOICE NUMBER': '',
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
      'Notlar': '',
      'Payment Terms': '',
      'Transport Type': '',
      'Country of Origin': '',
    });
    
    // Packing items listesini de sıfırla
    setPackingItems([{
      id: 1,
      'ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE': '',
      'FABRIC WEIGHT / WIDHT': '',
      'QUANTITY (METERS)': '',
      'ROLL NUMBER ROLL DIMENSIONS': '',
      'LOT': '',
      'GROSS WEIGHT(KG)': '',
      'NET WEIGHT (KG)': ''
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
        <h2>PACKING LIST</h2>
        <p>PACKING LIST BİLGİLERİNİ DOLDURUN</p>
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
        {/* Invoice Information Section */}
        <div className="form-section">
          <h3 className="section-title">INVOICE INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">INVOICE NUMBER</label>
              <input
                type="text"
                className="form-input"
                value={formData['INVOICE NUMBER']}
                onChange={(e) => handleInputChange('INVOICE NUMBER', e.target.value)}
                placeholder="Fatura numarası"
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
          </div>
        </div>

        {/* Packing Items Section */}
        <div className="form-section">
          <div className="goods-header">
            <h3 className="section-title">PACKING DETAILS</h3>
            <div className="header-buttons">
              <button
                type="button"
                className="btn btn-create-label"
                onClick={handleCreateProductLabels}
                disabled={isGeneratingLabels || isGenerating}
              >
                {isGeneratingLabels ? (
                  <>
                    <span className="spinner"></span>
                    Etiketler Oluşturuluyor...
                  </>
                ) : (
                  <>📋 Etiket Oluştur</>
                )}
              </button>
              <button
                type="button"
                className="btn btn-add-goods"
                onClick={addPackingItem}
              >
                + Yeni Ürün Ekle
              </button>
            </div>
          </div>
          
          {packingItems.map((item, index) => (
            <div key={item.id} className="goods-item">
              <div className="goods-item-header">
                <h4 className="goods-item-title">Ürün #{index + 1}</h4>
                {packingItems.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-remove-goods"
                    onClick={() => removePackingItem(item.id)}
                  >
                    × Sil
                  </button>
                )}
              </div>
              
              <div className="goods-container">
                <div className="goods-grid-row">
                  <div className="form-group">
                      <label className="form-label">
                      ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE{" "}
                      <span style={{ color: 'red' }}>*-her bilgi arasında "/" işareti kullan!</span>
                    </label>
                      <textarea
                      className="form-textarea"
                      value={item['ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE']}
                      onChange={(e) => handlePackingItemChange(item.id, 'ARTICLE NUMBER / COMPOSITION / CUSTOMS CODE', e.target.value)}
                      placeholder="Ürün numarası / Kompozisyon / Gümrük kodu"
                      rows="2"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">FABRIC WEIGHT / WIDHT</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['FABRIC WEIGHT / WIDHT']}
                      onChange={(e) => handlePackingItemChange(item.id, 'FABRIC WEIGHT / WIDHT', e.target.value)}
                      placeholder="Kumaş ağırlığı / Genişlik"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">QUANTITY (METERS)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['QUANTITY (METERS)']}
                      onChange={(e) => handlePackingItemChange(item.id, 'QUANTITY (METERS)', e.target.value)}
                      placeholder="Miktar (metre)"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">ROLL NUMBER ROLL DIMENSIONS</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['ROLL NUMBER ROLL DIMENSIONS']}
                      onChange={(e) => handlePackingItemChange(item.id, 'ROLL NUMBER ROLL DIMENSIONS', e.target.value)}
                      placeholder="Top numarası ve ölçüleri"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">LOT</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['LOT']}
                      onChange={(e) => handlePackingItemChange(item.id, 'LOT', e.target.value)}
                      placeholder="Lot numarası"
                    />
                  </div>
                </div>
                
                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">GROSS WEIGHT(KG)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['GROSS WEIGHT(KG)']}
                      onChange={(e) => handlePackingItemChange(item.id, 'GROSS WEIGHT(KG)', e.target.value)}
                      placeholder="Brüt ağırlık (kg)"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">NET WEIGHT (KG)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['NET WEIGHT (KG)']}
                      onChange={(e) => handlePackingItemChange(item.id, 'NET WEIGHT (KG)', e.target.value)}
                      placeholder="Net ağırlık (kg)"
                      step="0.01"
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

export default PackingListForm;
