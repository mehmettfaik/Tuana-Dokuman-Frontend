import React, { useState, useEffect } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import SystemStatus from './SystemStatus';
import RecipientManager from './RecipientManager';
import ArticleSearch from './ArticleSearch';
import { createFormRecord, getFormRecords, getFormRecord, deleteFormRecord } from '../api';
import { auth } from '../firebase/config';
import '../css/PriceListForm.css';

const PriceListForm = ({ selectedLanguage }) => {
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
    // Price List specific fields
    'PRICE LIST NUMBER': '',
    'PRICE LIST DATE': new Date().toISOString().split('T')[0],
    
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
    
    // Validity
    'VALIDITY DAYS': '60',
    
    // Notes
    'Notlar': '',
    
    // Payment & Shipping Details
    'Payment Terms': '',
    'Transport Type': '',
    
    // İmza ve Kaşe
    'İmza ve Kaşe': false,
  });

  // Article Items
  const [articles, setArticles] = useState([
    {
      id: 1,
      'ARTICLE INFO': '',
      'COMPOSITION': '',
      'STANDARD BULK MOQ': '',
      'PERSONALIZED SAMPLING MOQ': '',
      'CURRENCY': 'EUR',
      priceTiers: [
        { range: '1000 METERS', price: '' },
        { range: '999-500 METERS', price: '' },
        { range: '499-101 METERS', price: '' },
        { range: '100-1 METERS', price: '' }
      ]
    }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copyRecipientToDelivery, setCopyRecipientToDelivery] = useState(false);

  // PDF generation hook
  const { isGenerating, progress, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  // Geçmiş belgeler
  const [savedForms, setSavedForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [formsError, setFormsError] = useState('');
  const [initialDataStr, setInitialDataStr] = useState(null);
  const [isCustomEntry, setIsCustomEntry] = useState(false);
  const [isCustomTransport, setIsCustomTransport] = useState(false);

  // Sayfa yüklendiğinde geçmiş belgeleri yükle
  useEffect(() => {
    loadSavedForms();
  }, []);

  const loadSavedForms = async () => {
    setLoadingForms(true);
    setFormsError('');
    try {
      const forms = await getFormRecords('price-list');
      setSavedForms(forms || []);
    } catch (error) {
      console.warn('Geçmiş belgeler yüklenemedi:', error.message);
      setSavedForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleSelectForm = async (formId) => {
    setSelectedFormId(formId);
    setFormsError('');
    try {
      const formRecord = await getFormRecord(formId);
      
      if (formRecord.formData) {
        setFormData(formRecord.formData);
        const transportVal = formRecord.formData['Transport Type'] || '';
        const standardOptions = ['CIF', 'FOB', 'EXW', 'DAP'];
        if (transportVal && !standardOptions.includes(transportVal)) {
          setIsCustomTransport(true);
        } else {
          setIsCustomTransport(false);
        }
      }
      
      // Article listesini doldur
      let articlesData = null;
      if (formRecord.articles && Array.isArray(formRecord.articles) && formRecord.articles.length > 0) {
        articlesData = formRecord.articles;
      } else if (formRecord.formData?.articles && Array.isArray(formRecord.formData.articles) && formRecord.formData.articles.length > 0) {
        articlesData = formRecord.formData.articles;
      }
      
      if (articlesData) {
        setArticles(articlesData);
        setInitialDataStr(JSON.stringify({ ...formRecord.formData, articles: articlesData }));
      } else {
        setInitialDataStr(JSON.stringify({ ...formRecord.formData, articles: articles }));
      }
      
      setSuccess('Form verileri başarıyla yüklendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Form verisi yüklenirken hata:', error);
      setFormsError('Form verisi yüklenemedi');
    }
  };

  const handleDeleteForm = async (formId, e) => {
    e.stopPropagation();
    if (!window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) return;
    setFormsError('');
    try {
      await deleteFormRecord(formId);
      setSuccess('Belge başarıyla silindi');
      setTimeout(() => setSuccess(''), 3000);
      if (selectedFormId === formId) setSelectedFormId(null);
      setSavedForms(prev => prev.filter(f => f.id !== formId));
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

  const handleCopyToDelivery = (checked) => {
    setCopyRecipientToDelivery(checked);
    
    if (checked) {
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

  const handleTransportTypeChange = (e) => {
    const val = e.target.value;
    if (val === '--Düzenlenebilir--') {
      setIsCustomTransport(true);
      handleInputChange('Transport Type', '');
    } else {
      setIsCustomTransport(false);
      handleInputChange('Transport Type', val);
    }
  };

  // Article handlers
  const handleArticleChange = (id, field, value) => {
    setArticles(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handlePriceTierChange = (articleId, tierIndex, field, value) => {
    setArticles(prev => prev.map(item => {
      if (item.id === articleId) {
        const newTiers = [...item.priceTiers];
        newTiers[tierIndex] = { ...newTiers[tierIndex], [field]: value };
        return { ...item, priceTiers: newTiers };
      }
      return item;
    }));
  };

  const addArticle = () => {
    const newId = Math.max(...articles.map(a => a.id)) + 1;
    setArticles(prev => [...prev, {
      id: newId,
      'ARTICLE INFO': '',
      'COMPOSITION': '',
      'STANDARD BULK MOQ': '',
      'PERSONALIZED SAMPLING MOQ': '',
      'CURRENCY': 'EUR',
      priceTiers: [
        { range: '1000 METERS', price: '' },
        { range: '999-500 METERS', price: '' },
        { range: '499-101 METERS', price: '' },
        { range: '100-1 METERS', price: '' }
      ]
    }]);
  };

  const removeArticle = (id) => {
    if (articles.length > 1) {
      setArticles(prev => prev.filter(item => item.id !== id));
    }
  };

  const addPriceTier = (articleId) => {
    setArticles(prev => prev.map(item => {
      if (item.id === articleId) {
        return {
          ...item,
          priceTiers: [...item.priceTiers, { range: '', price: '' }]
        };
      }
      return item;
    }));
  };

  const removePriceTier = (articleId, tierIndex) => {
    setArticles(prev => prev.map(item => {
      if (item.id === articleId && item.priceTiers.length > 1) {
        const newTiers = item.priceTiers.filter((_, i) => i !== tierIndex);
        return { ...item, priceTiers: newTiers };
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const combinedData = {
        ...formData,
        articles: articles
      };
      
      const currentDataStr = JSON.stringify(combinedData);
      
      // Firestore'a kaydet
      if (currentDataStr !== initialDataStr) {
        try {
          await createFormRecord(combinedData, 'price-list');
          setInitialDataStr(currentDataStr);
          await loadSavedForms();
        } catch (saveError) {
          console.warn('Form kaydedilemedi:', saveError.message);
        }
      }
      
      // PDF oluştur ve indir
      const result = await generatePDFWithHook(combinedData, 'price-list', selectedLanguage);
      
      if (result) {
        setSuccess('Price List PDF başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
      'PRICE LIST NUMBER': '',
      'PRICE LIST DATE': new Date().toISOString().split('T')[0],
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
      'VALIDITY DAYS': '60',
      'Notlar': '',
      'Payment Terms': '',
      'Transport Type': '',
      'İmza ve Kaşe': false,
    });
    
    setArticles([{
      id: 1,
      'ARTICLE INFO': '',
      'COMPOSITION': '',
      'STANDARD BULK MOQ': '',
      'PERSONALIZED SAMPLING MOQ': '',
      'NOTES': '',
      'CURRENCY': 'EUR',
      priceTiers: [
        { range: '1000 METERS', price: '' },
        { range: '999-500 METERS', price: '' },
        { range: '499-101 METERS', price: '' },
        { range: '100-1 METERS', price: '' }
      ]
    }]);
    
    setCopyRecipientToDelivery(false);
    setIsCustomEntry(false);
    setIsCustomTransport(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="pricelist-form-container">
      <div className="pricelist-form-header">
        <h2>PRICE LIST</h2>
        <p>FİYAT LİSTESİ BİLGİLERİNİ DOLDURUN</p>
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

      {/* GEÇMİŞ BELGELER LİSTESİ */}
      <div className="saved-forms-section">
        <h3>Geçmiş Belgeler</h3>
        {loadingForms && <div className="loading-indicator"><span className="spinner"></span> Belgeler yükleniyor...</div>}
        {formsError && <div className="alert alert-error">{formsError}</div>}
        {!loadingForms && savedForms.length === 0 && <p className="no-forms-message">Henüz kaydedilmiş belge bulunmuyor.</p>}
        {!loadingForms && savedForms.length > 0 && (
          <div className="saved-forms-list">
            {savedForms.map((form) => (
              <div key={form.id} className={`saved-form-item ${selectedFormId === form.id ? 'selected' : ''}`} onClick={() => handleSelectForm(form.id)}>
                <div className="form-item-header">
                  <div className="form-item-info">
                    <strong>Price List No: {form.formData?.['PRICE LIST NUMBER'] || 'N/A'}</strong>
                    <span className="form-item-date">{new Date(form.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button className="btn-delete-small" onClick={(e) => handleDeleteForm(form.id, e)} title="Belgeyi Sil">✕</button>
                </div>
                <div className="form-item-details">
                  <span>Müşteri: {form.formData?.['RECIPIENT Şirket Adı'] || 'N/A'}</span>
                  <span>Artikel Sayısı: {form.formData?.articles?.length || form.articles?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="pricelist-form">
        {/* Price List Information */}
        <div className="form-section">
          <h3 className="section-title">PRICE LIST INFORMATION</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">PRICE LIST NUMBER</label>
              <input
                type="text"
                className="form-input"
                value={formData['PRICE LIST NUMBER']}
                onChange={(e) => handleInputChange('PRICE LIST NUMBER', e.target.value)}
                placeholder="Fiyat listesi numarası giriniz"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">DATE</label>
              <input
                type="date"
                className="form-input"
                value={formData['PRICE LIST DATE']}
                onChange={(e) => handleInputChange('PRICE LIST DATE', e.target.value)}
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
              <input type="text" className="form-input" value={formData['RECIPIENT Şirket Adı']} onChange={(e) => handleInputChange('RECIPIENT Şirket Adı', e.target.value)} placeholder="Alıcı şirket adı" />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Adres</label>
              <textarea className="form-textarea" value={formData['RECIPIENT Adres']} onChange={(e) => handleInputChange('RECIPIENT Adres', e.target.value)} placeholder="Alıcı şirket adresi" rows="3" />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT İlçe İl Ülke</label>
              <input type="text" className="form-input" value={formData['RECIPIENT İlçe İl Ülke']} onChange={(e) => handleInputChange('RECIPIENT İlçe İl Ülke', e.target.value)} placeholder="İlçe, İl, Ülke" />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Vat</label>
              <input type="text" className="form-input" value={formData['RECIPIENT Vat']} onChange={(e) => handleInputChange('RECIPIENT Vat', e.target.value)} placeholder="Vergi numarası" />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Sorumlu Kişi</label>
              <input type="text" className="form-input" value={formData['RECIPIENT Sorumlu Kişi']} onChange={(e) => handleInputChange('RECIPIENT Sorumlu Kişi', e.target.value)} placeholder="Alıcı sorumlu kişi" />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Telefon</label>
              <input type="tel" className="form-input" value={formData['RECIPIENT Telefon']} onChange={(e) => handleInputChange('RECIPIENT Telefon', e.target.value)} placeholder="Alıcı telefon" />
            </div>
            <div className="form-group">
              <label className="form-label">RECIPIENT Email</label>
              <input type="text" className="form-input" value={formData['RECIPIENT Email']} onChange={(e) => handleInputChange('RECIPIENT Email', e.target.value)} placeholder="Alıcı e-posta" />
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
              <input type="text" className="form-input" value={formData['DELIVERY ADDRESS Şirket Adı']} onChange={(e) => handleInputChange('DELIVERY ADDRESS Şirket Adı', e.target.value)} placeholder="Teslimat şirket adı" />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Adres</label>
              <textarea className="form-textarea" value={formData['DELIVERY ADDRESS Adres']} onChange={(e) => handleInputChange('DELIVERY ADDRESS Adres', e.target.value)} placeholder="Teslimat adresi" rows="3" />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS İlçe İl Ülke</label>
              <input type="text" className="form-input" value={formData['DELIVERY ADDRESS İlçe İl Ülke']} onChange={(e) => handleInputChange('DELIVERY ADDRESS İlçe İl Ülke', e.target.value)} placeholder="İlçe, İl, Ülke" />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Vat</label>
              <input type="text" className="form-input" value={formData['DELIVERY ADDRESS Vat']} onChange={(e) => handleInputChange('DELIVERY ADDRESS Vat', e.target.value)} placeholder="Teslimat vergi numarası" />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Sorumlu Kişi</label>
              <input type="text" className="form-input" value={formData['DELIVERY ADDRESS Sorumlu Kişi']} onChange={(e) => handleInputChange('DELIVERY ADDRESS Sorumlu Kişi', e.target.value)} placeholder="Teslimat sorumlu kişi" />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Telefon</label>
              <input type="tel" className="form-input" value={formData['DELIVERY ADDRESS Telefon']} onChange={(e) => handleInputChange('DELIVERY ADDRESS Telefon', e.target.value)} placeholder="Teslimat telefon" />
            </div>
            <div className="form-group">
              <label className="form-label">DELIVERY ADDRESS Email</label>
              <input type="text" className="form-input" value={formData['DELIVERY ADDRESS Email']} onChange={(e) => handleInputChange('DELIVERY ADDRESS Email', e.target.value)} placeholder="Teslimat e-posta" />
            </div>
          </div>
        </div>

        {/* Validity Section */}
        <div className="form-section">
          <h3 className="section-title">VALIDITY / GEÇERLİLİK SÜRESİ</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">GEÇERLİLİK SÜRESİ (GÜN)</label>
              <input
                type="number"
                className="form-input"
                value={formData['VALIDITY DAYS']}
                onChange={(e) => handleInputChange('VALIDITY DAYS', e.target.value)}
                placeholder="60"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Article Items Section */}
        <div className="form-section">
          <div className="goods-header">
            <h3 className="section-title">ARTICLE / ÜRÜNLER</h3>
            <button
              type="button"
              className="btn btn-add-goods"
              onClick={addArticle}
            >
              + Yeni Artikel Ekle
            </button>
          </div>
          
          {articles.map((article, index) => (
            <div key={article.id} className="goods-item">
              <div className="goods-item-header">
                <h4 className="goods-item-title">Artikel #{index + 1}</h4>
                {articles.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-remove-goods"
                    onClick={() => removeArticle(article.id)}
                  >
                    × Sil
                  </button>
                )}
              </div>
              
              <div className="goods-container">
                <div className="goods-grid-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">ARTICLE INFO (No - Gramaj - En)</label>
                    <ArticleSearch
                      value={article['ARTICLE INFO']}
                      onChange={(val) => handleArticleChange(article.id, 'ARTICLE INFO', val)}
                      onSelect={(selectedArticle) => {
                        // Artikel bilgilerini birleştir
                        const articleInfo = `${selectedArticle.articleNumber || ''} - ${selectedArticle.fabricWeightWidth || ''}`.trim();
                        handleArticleChange(article.id, 'ARTICLE INFO', articleInfo);
                      }}
                      placeholder="Örn: T-16158 - 150 GR/M2 - 150 CM"
                    />
                  </div>
                  
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">PARA BİRİMİ</label>
                    <select
                      className="form-input"
                      value={article['CURRENCY']}
                      onChange={(e) => handleArticleChange(article.id, 'CURRENCY', e.target.value)}
                    >
                      <option value="EUR">€ EUR</option>
                      <option value="USD">$ USD</option>
                      <option value="TRY">₺ TRY</option>
                    </select>
                  </div>
                </div>

                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">COMPOSITION / KOMPOZİSYON</label>
                    <input
                      type="text"
                      className="form-input"
                      value={article['COMPOSITION']}
                      onChange={(e) => handleArticleChange(article.id, 'COMPOSITION', e.target.value)}
                      placeholder="Örn: 50% COTTON 50% LINEN"
                    />
                  </div>
                </div>

                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">STANDARD BULK MOQ</label>
                    <input
                      type="text"
                      className="form-input"
                      value={article['STANDARD BULK MOQ']}
                      onChange={(e) => handleArticleChange(article.id, 'STANDARD BULK MOQ', e.target.value)}
                      placeholder="Örn: 1000 METERS"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">PERSONALIZED SAMPLING MOQ</label>
                    <input
                      type="text"
                      className="form-input"
                      value={article['PERSONALIZED SAMPLING MOQ']}
                      onChange={(e) => handleArticleChange(article.id, 'PERSONALIZED SAMPLING MOQ', e.target.value)}
                      placeholder="Örn: 100 METERS"
                    />
                  </div>
                </div>

                <div className="goods-grid-row">
                  <div className="form-group">
                    <label className="form-label">NOTLAR (2-3 satır)</label>
                    <textarea
                      className="form-textarea"
                      value={article['NOTES'] || ''}
                      onChange={(e) => handleArticleChange(article.id, 'NOTES', e.target.value)}
                      placeholder="Bu ürüne özel not..."
                      rows="2"
                    />
                  </div>
                </div>

                {/* Fiyat Kademeleri */}
                <div className="price-tiers-section">
                  <div className="price-tiers-header">
                    <label className="form-label" style={{ marginBottom: 0 }}>FİYAT KADEMELERİ</label>
                    <button
                      type="button"
                      className="btn btn-add-tier"
                      onClick={() => addPriceTier(article.id)}
                    >
                      + Kademe Ekle
                    </button>
                  </div>
                  
                  {article.priceTiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="price-tier-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <input
                          type="text"
                          className="form-input"
                          value={tier.range}
                          onChange={(e) => handlePriceTierChange(article.id, tierIndex, 'range', e.target.value)}
                          placeholder="Metre aralığı (Örn: 1000 METERS)"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <input
                          type="text"
                          className="form-input"
                          value={tier.price}
                          onChange={(e) => handlePriceTierChange(article.id, tierIndex, 'price', e.target.value)}
                          placeholder="Fiyat"
                        />
                      </div>
                      {article.priceTiers.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-remove-tier"
                          onClick={() => removePriceTier(article.id, tierIndex)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
                <option value=" DAYS">--Düzenlenebilir-- </option>
                <option value="30 DAYS">30 DAYS</option>
                <option value="60 DAYS">60 DAYS</option>
                <option value="90 DAYS">90 DAYS</option>
                <option value="120 DAYS">120 DAYS</option>
                <option value="150 DAYS">150 DAYS</option>
                <option value="180 DAYS">180 DAYS</option>
                <option value="IMMEDIATELY">IMMEDIATELY</option>
                <option value="ADVANCED PAYMENT">ADVANCED PAYMENT</option>
              </select>

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
                value={isCustomTransport ? '--Düzenlenebilir--' : formData['Transport Type']}
                onChange={handleTransportTypeChange}
              >
                <option value="">Taşıma türü seçin</option>
                <option value="CIF">CIF</option>
                <option value="FOB">FOB</option>
                <option value="EXW">EXW</option>
                <option value="DAP">DAP</option>
                <option value="CIF, FOB, EXW, DAP">CIF, FOB, EXW, DAP</option>
                <option value="--Düzenlenebilir--">--Düzenlenebilir--</option>
              </select>
              {isCustomTransport && (
                <input
                  type="text"
                  className="form-input"
                  style={{ marginTop: "8px" }}
                  value={formData['Transport Type']}
                  onChange={(e) => handleInputChange('Transport Type', e.target.value)}
                  placeholder="Taşıma türünü girin"
                />
              )}
            </div>
          </div>
        </div>

        {/* İmza ve Kaşe Checkbox */}
        <div className="form-section" style={{ marginTop: '20px' }}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="imza-kase"
              checked={formData['İmza ve Kaşe']}
              onChange={(e) => handleInputChange('İmza ve Kaşe', e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label htmlFor="imza-kase" style={{ cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>
              İmza ve Kaşe
            </label>
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

        {/* Loading Spinner Overlay */}
        {isGenerating && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            borderRadius: '8px'
          }}>
            <div style={{
              position: 'sticky',
              top: '50vh',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: '20vh'
            }}>
            <div className="spinner" style={{
              border: '6px solid #ffffff',
              borderTop: '6px solid #000000',
              borderRadius: '50%',
              width: '60px',
              height: '60px',
              animation: 'spin 1.5s linear infinite',
              marginBottom: '20px'
            }}></div>
            <h2 style={{ color: 'white', letterSpacing: '1px' }}>
              'PDF Oluşturuluyor...'
            </h2>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default PriceListForm;
