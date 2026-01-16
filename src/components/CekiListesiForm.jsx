import React, { useState, useEffect, useRef } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import { createFormRecord, getFormRecords, getFormRecord, deleteFormRecord } from '../api';
import { auth } from '../firebase/config';
import { COMPANIES } from '../data/companies';
import '../css/CekiListesiForm.css';

const CekiListesiForm = ({ selectedLanguage }) => {
  // Üst bilgiler
  const [formData, setFormData] = useState({
    musteriAdi: '',
    faturaNo: '',
    irsaliyeNo: '',
    artikelKodu: '',
    karisim: '',
    renkKodu: '',
    desenNo: '',
    not: '',
  });

  // Müşteri arama
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Excel tarzı basit tablo - sadece Metre ve Lot
  const [rows, setRows] = useState([
    { id: 1, metre: '', lot: '' }
  ]);

  const tableRef = useRef(null);

  // UI state'leri
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGeneratingLabels, setIsGeneratingLabels] = useState(false);
  
  // PDF generation hook
  const { isGenerating, progress, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  // Geçmiş belgeler
  const [savedForms, setSavedForms] = useState([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);

  useEffect(() => {
    loadSavedForms();
  }, []);

  const loadSavedForms = async () => {
    setLoadingForms(true);
    try {
      const forms = await getFormRecords('ceki-listesi');
      setSavedForms(forms || []);
    } catch (error) {
      setSavedForms([]);
    } finally {
      setLoadingForms(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Müşteri alanı için arama yap
    if (name === 'musteriAdi') {
      if (value.length >= 1) {
        const filtered = COMPANIES.filter(company => 
          company.toLowerCase().includes(value.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 10)); // Max 10 sonuç
        setShowDropdown(filtered.length > 0);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }
  };

  // Müşteri seçimi
  const handleSelectCompany = (company) => {
    setFormData(prev => ({ ...prev, musteriAdi: company }));
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Satır ekleme
  const addRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows(prev => [...prev, { id: newId, metre: '', lot: '' }]);
  };

  // Satır silme
  const removeRow = (id) => {
    if (rows.length <= 1) {
      setError('En az bir satır olmalıdır.');
      setTimeout(() => setError(''), 2000);
      return;
    }
    setRows(prev => prev.filter(row => row.id !== id));
  };

  // Hücre değişikliği
  const handleCellChange = (id, field, value) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Klavye ile navigasyon (Enter ile aynı sütunda alt satıra geç)
  const handleKeyDown = (e, rowIndex, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Aynı sütunda bir alt satıra geç, son satırdaysa yeni satır ekle
      if (rowIndex === rows.length - 1) {
        addRow();
        setTimeout(() => {
          const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-field="${field}"]`);
          if (nextInput) nextInput.focus();
        }, 50);
      } else {
        const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-field="${field}"]`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'lot' && rowIndex === rows.length - 1) {
      e.preventDefault();
      addRow();
      setTimeout(() => {
        const nextInput = document.querySelector(`[data-row="${rowIndex + 1}"][data-field="metre"]`);
        if (nextInput) nextInput.focus();
      }, 50);
    }
  };

  // Toplam metre
  const totalMetre = rows.reduce((sum, row) => {
    const val = parseFloat(row.metre);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  // Kaydet
  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Oturum açmanız gerekiyor.');
        return;
      }

      // API iki parametre bekliyor: (formData, formType)
      await createFormRecord({
        ...formData,
        rows,
        language: selectedLanguage,
        userId: user.uid,
        userEmail: user.email
      }, 'ceki-listesi');

      setSuccess('Kaydedildi!');
      loadSavedForms();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Kaydetme hatası: ' + err.message);
    }
  };

  // Yükle
  const handleLoad = async (formId) => {
    try {
      const record = await getFormRecord(formId);
      if (record) {
        if (record.formData) setFormData(record.formData);
        if (record.rows) setRows(record.rows);
        setSelectedFormId(formId);
        setSuccess('Yüklendi!');
        setTimeout(() => setSuccess(''), 2000);
      }
    } catch (err) {
      setError('Yükleme hatası.');
    }
  };

  // Sil
  const handleDelete = async (formId) => {
    if (!window.confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await deleteFormRecord(formId);
      loadSavedForms();
      if (selectedFormId === formId) setSelectedFormId(null);
      setSuccess('Silindi!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Silme hatası.');
    }
  };

  // Sıfırla
  const handleReset = () => {
    setFormData({
      musteriAdi: '',
      faturaNo: '',
      irsaliyeNo: '',
      artikelKodu: '',
      karisim: '',
      renkKodu: '',
      desenNo: '',
      not: '',
    });
    setRows([{ id: 1, metre: '', lot: '' }]);
    setSelectedFormId(null);
  };

  // PDF oluştur
  const handleGeneratePDF = async () => {
    try {
      await generatePDFWithHook({ formType: 'ceki-listesi', formData, rows }, 'ceki-listesi', selectedLanguage);
      setSuccess('PDF oluşturuldu!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('PDF hatası: ' + err.message);
    }
  };

  // Etiket Oluştur
  const handleGenerateLabels = async () => {
    try {
      setIsGeneratingLabels(true);
      setError('');
      
      const user = auth.currentUser;
      if (!user) {
        setError('Oturum açmanız gerekiyor.');
        return;
      }

      const token = await user.getIdToken();
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/pdf/ceki-listesi-labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          rows,
          language: selectedLanguage
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ceki-listesi-etiketleri-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setSuccess('Etiketler oluşturuldu!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Etiket oluşturma hatası.');
      }
    } catch (err) {
      console.error('Etiket oluşturma hatası:', err);
      setError('Etiket oluşturma hatası: ' + err.message);
    } finally {
      setIsGeneratingLabels(false);
    }
  };

  return (
    <div className="ceki-form">
      <h2>ÇEKİ LİSTESİ</h2>

      {error && <div className="msg error">{error}</div>}
      {success && <div className="msg success">{success}</div>}
      {pdfError && <div className="msg error">{pdfError}</div>}

      {/* GEÇMİŞ BELGELER LİSTESİ */}
      <div className="saved-forms-section">
        <h3>Geçmiş Belgeler</h3>
        {loadingForms && <div className="loading-indicator"><span className="spinner"></span> Belgeler yükleniyor...</div>}
        {!loadingForms && savedForms.length === 0 && <p className="no-forms-message">Henüz kaydedilmiş çeki listesi bulunmuyor.</p>}
        {!loadingForms && savedForms.length > 0 && (
          <div className="saved-forms-list">
            {savedForms.map((form) => (
              <div key={form.id} className={`saved-form-item ${selectedFormId === form.id ? 'selected' : ''}`} onClick={() => handleLoad(form.id)}>
                <div className="form-item-header">
                  <div className="form-item-info">
                    <strong>{form.formData?.musteriAdi || 'İsimsiz'}</strong>
                    <span className="form-item-date">{new Date(form.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <button className="btn-delete-small" onClick={(e) => { e.stopPropagation(); handleDelete(form.id); }} title="Belgeyi Sil">✕</button>
                </div>
                <div className="form-item-details">
                  <span>Fatura No: {form.formData?.faturaNo || 'N/A'}</span>
                  <span>Artikel: {form.formData?.artikelKodu || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Üst Bilgiler */}
      <div className="info-grid">
        <div className="field field-autocomplete" ref={dropdownRef}>
          <label>Müşteri</label>
          <input 
            name="musteriAdi" 
            value={formData.musteriAdi} 
            onChange={handleFormChange} 
            placeholder="Müşteri ara..." 
            autoComplete="off"
          />
          {showDropdown && searchResults.length > 0 && (
            <div className="autocomplete-dropdown">
              {searchResults.map((company, index) => (
                <div 
                  key={index} 
                  className="autocomplete-item"
                  onClick={() => handleSelectCompany(company)}
                >
                  {company}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="field">
          <label>Fatura No</label>
          <input name="faturaNo" value={formData.faturaNo} onChange={handleFormChange} placeholder="Fatura no" />
        </div>
        <div className="field">
          <label>İrsaliye No</label>
          <input name="irsaliyeNo" value={formData.irsaliyeNo} onChange={handleFormChange} placeholder="İrsaliye no" />
        </div>
        <div className="field">
          <label>Artikel Kodu</label>
          <input name="artikelKodu" value={formData.artikelKodu} onChange={handleFormChange} placeholder="Artikel kodu" />
        </div>
        <div className="field">
          <label>Karışım</label>
          <input name="karisim" value={formData.karisim} onChange={handleFormChange} placeholder="Karışım" />
        </div>
        <div className="field">
          <label>Renk Kodu</label>
          <input name="renkKodu" value={formData.renkKodu} onChange={handleFormChange} placeholder="Renk kodu" />
        </div>
        <div className="field">
          <label>Desen No</label>
          <input name="desenNo" value={formData.desenNo} onChange={handleFormChange} placeholder="Desen no" />
        </div>
      </div>

      {/* Not Alanı */}
      <div className="note-section">
        <label>Not</label>
        <textarea 
          name="not" 
          value={formData.not} 
          onChange={handleFormChange} 
          placeholder="Eklemek istediğiniz notlar..." 
          rows="3"
        />
      </div>

      {/* Excel Tablo */}
      <div className="excel-section">
        <table className="excel" ref={tableRef}>
          <thead>
            <tr>
              <th className="col-no">#</th>
              <th className="col-metre">Metre</th>
              <th className="col-lot">Lot</th>
              <th className="col-del"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id}>
                <td className="cell-no">{idx + 1}</td>
                <td className="cell">
                  <input
                    type="number"
                    step="0.01"
                    value={row.metre}
                    onChange={(e) => handleCellChange(row.id, 'metre', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 'metre')}
                    data-row={idx}
                    data-field="metre"
                    placeholder="0.00"
                  />
                </td>
                <td className="cell">
                  <input
                    type="text"
                    value={row.lot}
                    onChange={(e) => handleCellChange(row.id, 'lot', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, idx, 'lot')}
                    data-row={idx}
                    data-field="lot"
                    placeholder="Lot no"
                  />
                </td>
                <td className="cell-del">
                  <button onClick={() => removeRow(row.id)} title="Sil">×</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="foot-label">Toplam:</td>
              <td className="foot-total">{totalMetre.toFixed(2)} m</td>
              <td></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
        <button onClick={addRow} className="btn-add">+ Satır Ekle</button>
        <p className="hint">Enter tuşuyla sonraki hücreye geçin. Son satırda Enter ile yeni satır eklenir.</p>
      </div>

      {/* Butonlar */}
      <div className="actions">
        <button onClick={handleReset} className="btn reset">Sıfırla</button>
        <button onClick={handleSave} className="btn save">Kaydet</button>
        <button onClick={handleGeneratePDF} className="btn pdf" disabled={isGenerating}>
          {isGenerating ? `${progress}` : 'PDF Oluştur'}
        </button>
        <button onClick={handleGenerateLabels} className="btn label" disabled={isGeneratingLabels}>
          {isGeneratingLabels ? 'Oluşturuluyor...' : 'Etiket Oluştur'}
        </button>
      </div>
    </div>
  );
};

export default CekiListesiForm;
