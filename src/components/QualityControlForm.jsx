// src/components/QualityControlForm.jsx
import React, { useState, useEffect } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import { createFormRecord, getFormRecords, getFormRecord, deleteFormRecord } from '../api';
import '../css/QualityControlForm.css';

const QualityControlForm = ({ selectedLanguage }) => {
  // Ana form verisi
  const [formData, setFormData] = useState({
    'Article Code (Our)': '',
    'Article Code (Client)': '',
    'Order Number': '',
    'Client': '',
    'Composition': '',
    'Weight': '',
    'Width': ''
  });

  // Dinamik roll verisi
  const [rolls, setRolls] = useState([
    {
      id: 1,
      'Roll Number': '',
      'Batch Number': '',
      'Roll Length': '',
      measurements: [
        {
          id: 1,
          'Meter': '',
          'Description': '',
          'Point (1-4)': ''
        }
      ]
    }
  ]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Yeni PDF generation hook'u
  const { isGenerating, progress, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

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
      const forms = await getFormRecords('quality-control');
      // Normalize returned forms
      const normalized = (forms || []).map(f => ({
        ...f,
        rolls: f.rolls && Array.isArray(f.rolls) ? f.rolls : (f.formData?.rolls && Array.isArray(f.formData.rolls) ? f.formData.rolls : [])
      }));
      setSavedForms(normalized);
    } catch (error) {
      setSavedForms([]);
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
      
      // Rolls listesini doldur
      let rollsData = null;
      
      if (formRecord.rolls && Array.isArray(formRecord.rolls) && formRecord.rolls.length > 0) {
        rollsData = formRecord.rolls;
      } else if (formRecord.formData?.rolls && Array.isArray(formRecord.formData.rolls) && formRecord.formData.rolls.length > 0) {
        rollsData = formRecord.formData.rolls;
      }
      
      if (rollsData) {
        setRolls(rollsData);
      } else {
        console.warn('⚠️ Rolls verisi bulunamadı');
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
    e.stopPropagation();
    
    if (!window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    setFormsError('');
    try {
      await deleteFormRecord(formId);
      setSuccess('Belge başarıyla silindi');
      setTimeout(() => setSuccess(''), 3000);
      
      if (selectedFormId === formId) {
        setSelectedFormId(null);
      }
      
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

  // Roll verilerini güncelleme
  const handleRollChange = (rollId, field, value) => {
    setRolls(prev => prev.map(roll => {
      if (roll.id === rollId) {
        return { ...roll, [field]: value };
      }
      return roll;
    }));
  };

  // Measurement verilerini güncelleme
  const handleMeasurementChange = (rollId, measurementId, field, value) => {
    setRolls(prev => prev.map(roll => {
      if (roll.id === rollId) {
        return {
          ...roll,
          measurements: roll.measurements.map(measurement => {
            if (measurement.id === measurementId) {
              return { ...measurement, [field]: value };
            }
            return measurement;
          })
        };
      }
      return roll;
    }));
  };

  // Yeni roll ekleme
  const addRoll = () => {
    const newId = Math.max(...rolls.map(roll => roll.id)) + 1;
    setRolls(prev => [...prev, {
      id: newId,
      'Roll Number': '',
      'Batch Number': '',
      'Roll Length': '',
      measurements: [
        {
          id: 1,
          'Meter': '',
          'Description': '',
          'Point (1-4)': ''
        }
      ]
    }]);
  };

  // Roll silme
  const removeRoll = (rollId) => {
    if (rolls.length > 1) {
      setRolls(prev => prev.filter(roll => roll.id !== rollId));
    }
  };

  // Yeni measurement ekleme
  const addMeasurement = (rollId) => {
    setRolls(prev => prev.map(roll => {
      if (roll.id === rollId) {
        const newMeasurementId = Math.max(...roll.measurements.map(m => m.id)) + 1;
        return {
          ...roll,
          measurements: [...roll.measurements, {
            id: newMeasurementId,
            'Meter': '',
            'Description': '',
            'Point (1-4)': ''
          }]
        };
      }
      return roll;
    }));
  };

  // Measurement silme
  const removeMeasurement = (rollId, measurementId) => {
    setRolls(prev => prev.map(roll => {
      if (roll.id === rollId && roll.measurements.length > 1) {
        return {
          ...roll,
          measurements: roll.measurements.filter(m => m.id !== measurementId)
        };
      }
      return roll;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Form data ve rolls verilerini birleştir
      const combinedData = {
        ...formData,
        rolls: rolls,
        docType: 'quality-control',
        formType: 'quality-control'
      };
      
      // 1. Önce veriyi Firestore'a kaydet (Backend hazırsa)
      try {
        await createFormRecord(combinedData, 'quality-control');
        
        // Listeyi yenile
        await loadSavedForms();
      } catch (saveError) {
        // Backend hazır olmadığında sessizce devam et
      }
      
      // 2. PDF oluştur ve indir
      const documentType = 'quality-control';
      const success = await generatePDFWithHook(combinedData, documentType, selectedLanguage);
      
      if (success) {
        setSuccess('Quality Control Report PDF başarıyla oluşturuldu!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError('PDF oluşturulurken hata oluştu: ' + (error.message || error.toString()));
    }
  };

  const handleReset = () => {
    setFormData({
      'Article Code (Our)': '',
      'Article Code (Client)': '',
      'Order Number': '',
      'Client': '',
      'Composition': '',
      'Weight': '',
      'Width': ''
    });
    
    setRolls([{
      id: 1,
      'Roll Number': '',
      'Batch Number': '',
      'Roll Length': '',
      measurements: [
        {
          id: 1,
          'Meter': '',
          'Description': '',
          'Point (1-4)': ''
        }
      ]
    }]);
    
    setError('');
    setSuccess('');
  };

  return (
    <div className="quality-control-form-container">
      <div className="quality-control-form-header">
        <h2>QUALITY CONTROL REPORT</h2>
        <p>KALİTE KONTROL RAPORU BİLGİLERİNİ DOLDURUN</p>
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
                      Order No: {form.formData?.['Order Number'] || 'N/A'}
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
                  <span>Client: {form.formData?.['Client'] || 'N/A'}</span>
                  <span>Article (Our): {form.formData?.['Article Code (Our)'] || 'N/A'}</span>
                  <span>Roll Sayısı: {form.rolls?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="quality-control-form">
        {/* GENERAL INFORMATION */}
        <div className="form-section">
          <h3>GENERAL INFORMATION</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Article Code (Our):</label>
              <input
                type="text"
                value={formData['Article Code (Our)']}
                onChange={(e) => handleInputChange('Article Code (Our)', e.target.value)}
                placeholder="Article Code (Our)"
              />
            </div>
            <div className="form-group">
              <label>Article Code (Client):</label>
              <input
                type="text"
                value={formData['Article Code (Client)']}
                onChange={(e) => handleInputChange('Article Code (Client)', e.target.value)}
                placeholder="Article Code (Client)"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Order Number:</label>
              <input
                type="text"
                value={formData['Order Number']}
                onChange={(e) => handleInputChange('Order Number', e.target.value)}
                placeholder="Order Number"
              />
            </div>
            <div className="form-group">
              <label>Client:</label>
              <input
                type="text"
                value={formData['Client']}
                onChange={(e) => handleInputChange('Client', e.target.value)}
                placeholder="Client"
              />
            </div>
          </div>

          <div className="form-row"> 
            <div className="form-group">
              <label>Weight:</label>
              <input
                type="text"
                value={formData['Weight']}
                onChange={(e) => handleInputChange('Weight', e.target.value)}
                placeholder="Weight"
              />
            </div>
            <div className="form-group">
              <label>Width:</label>
              <input
                type="text"
                value={formData['Width']}
                onChange={(e) => handleInputChange('Width', e.target.value)}
                placeholder="Width"
              />
            </div>
          </div>

          <div className="form-row">
             <div className="form-group">
              <label>Composition:</label>
              <input
                type="text"
                value={formData['Composition']}
                onChange={(e) => handleInputChange('Composition', e.target.value)}
                placeholder="Composition"
              />
            </div>
          </div>
        </div>

        {/* ROLLS INFORMATION */}
        <div className="form-section">
          <div className="rolls-header">
            <h3>ROLLS INFORMATION</h3>
            <button
              type="button"
              onClick={addRoll}
              className="btn-add-roll"
            >
              + Add Roll
            </button>
          </div>

          {rolls.map((roll, rollIndex) => (
            <div key={roll.id} className="roll-section">
              <div className="roll-header">
                <h4>Roll #{rollIndex + 1}</h4>
                {rolls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoll(roll.id)}
                    className="btn-remove-roll"
                  >
                    Remove Roll
                  </button>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Roll Number:</label>
                  <input
                    type="text"
                    value={roll['Roll Number']}
                    onChange={(e) => handleRollChange(roll.id, 'Roll Number', e.target.value)}
                    placeholder="Roll Number"
                  />
                </div>
                <div className="form-group">
                  <label>Batch Number:</label>
                  <input
                    type="text"
                    value={roll['Batch Number']}
                    onChange={(e) => handleRollChange(roll.id, 'Batch Number', e.target.value)}
                    placeholder="Batch Number"
                  />
                </div>
                <div className="form-group">
                  <label>Roll Length:</label>
                  <input
                    type="text"
                    value={roll['Roll Length']}
                    onChange={(e) => handleRollChange(roll.id, 'Roll Length', e.target.value)}
                    placeholder="Roll Length"
                  />
                </div>
              </div>

              {/* Measurements for this roll */}
              <div className="measurements-section">
                <div className="measurements-header">
                  <h5> Roll #{rollIndex + 1} Fabric Defects</h5>
                  <button
                    type="button"
                    onClick={() => addMeasurement(roll.id)}
                    className="btn-add-measurement"
                  >
                    + Add Fabric Defect
                  </button>
                </div>

                {roll.measurements.map((measurement, measurementIndex) => (
                  <div key={measurement.id} className="measurement-row">
                    <div className="form-group">
                      <label>Meter:</label>
                      <input
                        type="text"
                        value={measurement['Meter']}
                        onChange={(e) => handleMeasurementChange(roll.id, measurement.id, 'Meter', e.target.value)}
                        placeholder="Meter"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description:</label>
                      <input
                        type="text"
                        value={measurement['Description']}
                        onChange={(e) => handleMeasurementChange(roll.id, measurement.id, 'Description', e.target.value)}
                        placeholder="Description"
                      />
                    </div>
                    <div className="form-group">
                      <label>Point (1-4):</label>
                      <select
                        value={measurement['Point (1-4)']}
                        onChange={(e) => handleMeasurementChange(roll.id, measurement.id, 'Point (1-4)', e.target.value)}
                      >
                        <option value="">Select Point</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                    {roll.measurements.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMeasurement(roll.id, measurement.id)}
                        className="btn-remove-measurement"
                        title="Remove Measurement"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={handleReset} className="btn-reset">
            TEMIZLE
          </button>
          <button type="submit" disabled={isGenerating} className="btn-submit">
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                PDF Oluşturuluyor...
              </>
            ) : (
              'PDF OLUŞTUR VE İNDİR'
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

export default QualityControlForm;