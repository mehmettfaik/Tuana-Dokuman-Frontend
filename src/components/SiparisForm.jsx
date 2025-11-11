import React, { useState, useEffect } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import RecipientManager from './RecipientManager';
import { createFormRecord, getFormRecords, getFormRecord, deleteFormRecord } from '../api';
import '../css/SiparisForm.css';

const SiparisForm = ({ selectedLanguage }) => {
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
    // Sipariş specific fields
    'ORDER DAY': '',
    'ORDER NUMBER': '',
    'SUPPLIER NUMBER': '',
    
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
    
    // Notes
    'Notlar': '',
  });

  // Sipariş ürün listesi - ekstra alanlarla
  const [goods, setGoods] = useState([
    {
      id: 1,
      'ARTIKEL NUMARASI': '',
      'GRAMAJ / EN': '',
      'KOMPOZISYON': '',
      'SEZON': '',
      'TERMIN': '',
      'ISLEM': '',
      'ADET (METRE)': '',
      'FIYAT': '',
      'AMOUNT': ''
    }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // RECIPIENT bilgilerini DELIVERY ADDRESS'e kopyalama için state
  const [copyRecipientToDelivery, setCopyRecipientToDelivery] = useState(false);

  // Yeni PDF generation hook'u
  const { isGenerating, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  // Geçmiş belgeler için state'ler
  const [savedForms, setSavedForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [formsError, setFormsError] = useState('');

  // Sayfa yüklendiğinde geçmiş belgeleri yükle
  useEffect(() => {
    loadSavedForms();
  }, []);

  // Geçmiş belgeleri yükleme fonksiyonu
  const loadSavedForms = async () => {
    setLoadingForms(true);
    setFormsError('');
    try {
      const forms = await getFormRecords('siparis');
      setSavedForms(forms || []);
    } catch (error) {
      console.warn('Geçmiş belgeler yüklenemedi (Backend henüz hazır değil):', error.message);
      // Backend hazır olmadığında sessizce başarısız ol
      setSavedForms([]);
      // Kullanıcıya gösterilecek hata mesajı yok - backend hazır olana kadar
    } finally {
      setLoadingForms(false);
    }
  };

  // Belge seçme ve form alanlarına doldurma
  const handleSelectForm = async (formId) => {
    setSelectedFormId(formId);
    setFormsError('');
    try {
      const formRecord = await getFormRecord(formId);
    
      // Form verilerini doldur
      if (formRecord.formData) {
        setFormData(formRecord.formData);
      }
      
      // Ürün listesini doldur - birden fazla yerde olabilir
      let goodsData = null;
      
      // 1. Önce doğrudan goods alanını kontrol et
      if (formRecord.goods && Array.isArray(formRecord.goods) && formRecord.goods.length > 0) {
        goodsData = formRecord.goods;
      }
      // 2. formData içinde goods varsa onu kullan
      else if (formRecord.formData?.goods && Array.isArray(formRecord.formData.goods) && formRecord.formData.goods.length > 0) {
        goodsData = formRecord.formData.goods;
      }
      
      if (goodsData) {
        setGoods(goodsData);
      } else {
        console.warn(' Goods verisi bulunamadı');
      }
      
      setSuccess('Form verileri başarıyla yüklendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Form verisi yüklenirken hata:', error);
      setFormsError('Form verisi yüklenemedi');
    }
  };

  // Belge silme fonksiyonu
  const handleDeleteForm = async (formId, e) => {
    e.stopPropagation(); // Parent click event'ini engelle
    
    if (!window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setFormsError('');
    try {
      await deleteFormRecord(formId);
      setSuccess('Belge başarıyla silindi');
      setTimeout(() => setSuccess(''), 3000);
      
      // Eğer silinen form seçili idiyse, seçimi temizle
      if (selectedFormId === formId) {
        setSelectedFormId(null);
      }
      
      // Listeyi yenile
      await loadSavedForms();
    } catch (error) {
      console.error('Belge silinirken hata:', error);
      setFormsError('Belge silinemedi');
    }
  };

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

  // Ürün verilerini güncelleme
  const handleGoodsChange = (id, field, value) => {
    setGoods(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // ADET (METRE) veya FIYAT değiştiğinde AMOUNT'u otomatik hesapla
        if (field === 'ADET (METRE)' || field === 'FIYAT') {
          const quantity = parseFloat(field === 'ADET (METRE)' ? value : updatedItem['ADET (METRE)']) || 0;
          const price = parseFloat(field === 'FIYAT' ? value : updatedItem['FIYAT']) || 0;
          updatedItem['AMOUNT'] = (quantity * price).toFixed(2);
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
      'ARTIKEL NUMARASI': '',
      'GRAMAJ / EN': '',
      'KOMPOZISYON': '',
      'SEZON': '',
      'TERMIN': '',
      'ISLEM': '',
      'ADET (METRE)': '',
      'FIYAT': '',
      'AMOUNT': ''
    }]);
  };

  // Ürün silme
  const removeGoods = (id) => {
    if (goods.length > 1) {
      setGoods(prev => prev.filter(item => item.id !== id));
    }
  };

  // Toplam tutar hesaplama
  const calculateTotal = () => {
    return goods.reduce((total, item) => {
      return total + (parseFloat(item['AMOUNT']) || 0);
    }, 0).toFixed(2);
  };

  // Form gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const requestData = {
        formData: formData,
        goods: goods,
        totals: {
          subtotal: calculateTotal(),
          total: calculateTotal()
        }
      };

      
      // 1. Önce veriyi Firestore'a kaydet (Backend hazırsa)
      try {
    await createFormRecord(requestData, 'siparis');        
        // Listeyi yenile
        await loadSavedForms();
      } catch (saveError) {
        console.warn('Form kaydedilemedi (Backend henüz hazır değil):', saveError.message);
        // Backend hazır olmadığında sessizce devam et - PDF oluşturmaya devam
      }
      
      // 2. PDF oluştur ve indir
      const success = await generatePDFWithHook(requestData, 'siparis', selectedLanguage);
      
      if (success) {
        setSuccess('Sipariş formu PDF başarıyla oluşturuldu!');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Sipariş formu gönderilirken bir hata oluştu: ' + (err.message || err.toString()));
    }
  };

  // Form sıfırlama
  const handleReset = () => {
    setFormData({
      'ORDER DAY': '',
      'ORDER NUMBER': '',
      'SUPPLIER NUMBER': '',
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
      'Notlar': '',
    });
    
    setGoods([{
      id: 1,
      'ARTIKEL NUMARASI': '',
      'GRAMAJ / EN': '',
      'KOMPOZISYON': '',
      'SEZON': '',
      'TERMIN': '',
      'ISLEM': '',
      'ADET (METRE)': '',
      'FIYAT': '',
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
    <div className="siparis-form-container">
      <div className="siparis-form-header">
        <h2>SİPARİŞ FORMU</h2>
        <p>SİPARİŞ BİLGİLERİNİ DOLDURUN.</p>
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

      {/* GEÇMİŞ BELGELER LİSTESİ */}
      <div className="saved-forms-section">
        <h3>Geçmiş Belgeler</h3>
        
        {loadingForms && (
          <div className="loading-indicator">
            <span className="spinner"></span> Belgeler yükleniyor...
          </div>
        )}
        
        {formsError && (
          <div className="alert alert-error">
            {formsError}
          </div>
        )}
        
        {!loadingForms && savedForms.length === 0 && (
          <p className="no-forms-message">Henüz kaydedilmiş belge bulunmuyor.</p>
        )}
        
        {!loadingForms && savedForms.length > 0 && (
          <div className="saved-forms-list">
            {savedForms.map((form) => (
              <div 
                key={form.id} 
                className={`saved-form-item ${selectedFormId === form.id ? 'selected' : ''}`}
                onClick={() => handleSelectForm(form.id)}
              >
                <div className="form-item-header">
                  <div className="form-item-info">
                    <strong>
                      Sipariş No: {form.formData?.['ORDER NUMBER'] || 'N/A'}
                    </strong>
                    <span className="form-item-date">
                      {new Date(form.createdAt).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <button 
                    className="btn-delete-small"
                    onClick={(e) => handleDeleteForm(form.id, e)}
                    title="Belgeyi Sil"
                  >
                    ✕
                  </button>
                </div>
                <div className="form-item-details">
                  <span>Müşteri: {form.formData?.['RECIPIENT Şirket Adı'] || 'N/A'}</span>
                  <span>Ürün Sayısı: {form.goods?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="siparis-form">
        {/* Sipariş Bilgileri */}
        <div className="form-section">
          <h3 className="section-title">Sipariş Bilgileri</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">SİPARİŞ GÜNÜ</label>
              <input
                type="date"
                className="form-input"
                value={formData['ORDER DAY']}
                onChange={(e) => handleInputChange('ORDER DAY', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">SİPARİŞ NUMARASI</label>
              <input
                type="text"
                className="form-input"
                value={formData['ORDER NUMBER']}
                onChange={(e) => handleInputChange('ORDER NUMBER', e.target.value)}
                placeholder="Sipariş numarasını girin"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">TEDARİKÇİ NUMARASI</label>
              <input
                type="text"
                className="form-input"
                value={formData['SUPPLIER NUMBER']}
                onChange={(e) => handleInputChange('SUPPLIER NUMBER', e.target.value)}
                placeholder="Tedarikçi numarasını girin"
                required
              />
            </div>
          </div>
        </div>

        {/* Responsible Person */}
        <div className="form-section">
          <h3 className="section-title">Sorumlu Satın Almacı Bilgileri</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">SORUMLU SATIN ALMACI</label>
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
              <label className="form-label">TELEFON</label>
              <input
                type="tel"
                className="form-input"
                value={formData['TELEPHONE']}
                onChange={(e) => handleInputChange('TELEPHONE', e.target.value)}
                placeholder="Telefon numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">EMAIL</label>
              <input
                type="text"
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
          <h3 className="section-title">Alıcı Bilgileri</h3>
          
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
              <label className="form-label">Alıcı Şirket Adı</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Şirket Adı']}
                onChange={(e) => handleInputChange('RECIPIENT Şirket Adı', e.target.value)}
                placeholder="Alıcı şirket adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alıcı Adres</label>
              <textarea
                className="form-textarea"
                value={formData['RECIPIENT Adres']}
                onChange={(e) => handleInputChange('RECIPIENT Adres', e.target.value)}
                placeholder="Alıcı adresini girin"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alıcı İlçe İl Ülke</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT İlçe İl Ülke']}
                onChange={(e) => handleInputChange('RECIPIENT İlçe İl Ülke', e.target.value)}
                placeholder="Alıcı İlçe, İl, Ülke bilgisini girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alıcı Vk</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Vat']}
                onChange={(e) => handleInputChange('RECIPIENT Vat', e.target.value)}
                placeholder="Vergi numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alıcı Sorumlu Kişi</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Sorumlu Kişi']}
                onChange={(e) => handleInputChange('RECIPIENT Sorumlu Kişi', e.target.value)}
                placeholder="Alıcı sorumlu kişi adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alıcı Telefon</label>
              <input
                type="text"
                className="form-input"
                value={formData['RECIPIENT Telefon']}
                onChange={(e) => handleInputChange('RECIPIENT Telefon', e.target.value)}
                placeholder="Alıcı telefon numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Alıcı Email</label>
              <input
                type="text"
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
              <label className="form-label">Teslimat Şirket Adı</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Şirket Adı']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Şirket Adı', e.target.value)}
                placeholder="Teslimat şirket adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teslimat Adres</label>
              <textarea
                className="form-textarea"
                value={formData['DELIVERY ADDRESS Adres']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Adres', e.target.value)}
                placeholder="Teslimat adresini girin"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teslimat İlçe İl Ülke</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS İlçe İl Ülke']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS İlçe İl Ülke', e.target.value)}
                placeholder="Teslimat İlçe, İl, Ülke bilgisini girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teslimat Vk</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Vat']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Vat', e.target.value)}
                placeholder="Teslimat vergi numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teslimat Sorumlu Kişi</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Sorumlu Kişi']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Sorumlu Kişi', e.target.value)}
                placeholder="Teslimat sorumlu kişi adını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teslimat Telefon</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Telefon']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Telefon', e.target.value)}
                placeholder="Teslimat telefon numarasını girin"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Teslimat Email</label>
              <input
                type="text"
                className="form-input"
                value={formData['DELIVERY ADDRESS Email']}
                onChange={(e) => handleInputChange('DELIVERY ADDRESS Email', e.target.value)}
                placeholder="Teslimat e-mail adresini girin"
              />
            </div>
          </div>
        </div>

        {/* Notlar */}
        <div className="form-section">
          <h3 className="section-title">Notlar</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Notlar</label>
              <textarea
                className="form-textarea"
                value={formData['Notlar']}
                onChange={(e) => handleInputChange('Notlar', e.target.value)}
                placeholder="Sipariş ile ilgili notlarınızı buraya yazabilirsiniz..."
                rows="4"
              />
            </div>
          </div>
        </div>

  {/* Payment & Shipping Details */}
         <div className="form-section">
          <h3 className="section-title">ÖDEME & KARGO DETAYLARI</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ödeme Vadesi</label>
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
              <label className="form-label">Taşıma Türü</label>
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
          </div>
        </div>


        {/* Sipariş Ürünleri */}
        <div className="form-section">
          <div className="goods-header">
            <h3 className="section-title">SİPARİŞ ÜRÜNLERİ</h3>
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
                    <label className="form-label">ARTIKEL NUMARASI</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['ARTIKEL NUMARASI']}
                      onChange={(e) => handleGoodsChange(item.id, 'ARTIKEL NUMARASI', e.target.value)}
                      placeholder="Artikel numarası"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">GRAMAJ / EN</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['GRAMAJ / EN']}
                      onChange={(e) => handleGoodsChange(item.id, 'GRAMAJ / EN', e.target.value)}
                      placeholder="Gramaj / En"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">KOMPOZISYON</label>
                    <textarea
                      type="text"
                      className="form-input"
                      value={item['KOMPOZISYON']}
                      onChange={(e) => handleGoodsChange(item.id, 'KOMPOZISYON', e.target.value)}
                      placeholder="Kompozisyon"
                      rows="3"
                    />
                  </div>
                </div>
                
                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">SEZON</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['SEZON']}
                      onChange={(e) => handleGoodsChange(item.id, 'SEZON', e.target.value)}
                      placeholder="Sezon"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">TERMIN</label>
                    <input
                      type="date"
                      className="form-input"
                      value={item['TERMIN']}
                      onChange={(e) => handleGoodsChange(item.id, 'TERMIN', e.target.value)}
                      placeholder="Termin"
                    />
                  </div>

                   <div className="form-group">
                    <label className="form-label">İŞLEM</label>
                    <textarea
                      type="text"
                      className="form-input"
                      value={item['İŞLEM']}
                      onChange={(e) => handleGoodsChange(item.id, 'İŞLEM', e.target.value)}
                      placeholder="İşlem"
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">ADET (METRE)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={item['ADET (METRE)']}
                      onChange={(e) => handleGoodsChange(item.id, 'ADET (METRE)', e.target.value)}
                      placeholder="Adet (metre)"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">FIYAT</label>
                    <input
                      type="text"
                      className="form-input price-input"
                      value={item['FIYAT']}
                      onChange={(e) => handleGoodsChange(item.id, 'FIYAT', e.target.value)}
                      placeholder="Birim fiyat (USD/EUR/TRY) Belirtiniz"
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
            {isGenerating ? <span className="spinner"></span> : null}
            {isGenerating ? 'PDF Oluşturuluyor...' : 'PDF Oluştur ve İndir'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiparisForm;
