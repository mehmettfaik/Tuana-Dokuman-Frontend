import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';
import '../css/FabricTechnicalForm.css';

const FabricTechnicalForm = ({ selectedLanguage }) => {
  const [formData, setFormData] = useState({
    'ARTICLE CODE': '',
    'CUSTOM TARIFF CODE': '',
    'COMPOSITION': '',
    'WEAW TYPE': '',
    'WEIGHT': '',
    'WIDTH / CUTABLE WIDTH': '',
    'CERTIFICATION': '',
    'CONSTRUCTION': '',
    'FINISH': '',
    'COLOUR': '',
    'JACQUARD PATTERN NAME': '',
    'ORIGIN': '',
    'SHRINKAGE IN WARP': '',
    'SHRINKAGE IN WEFT': '',
    'NOTE_1': '',
    'NOTE_2': '',
    'NOTE_3': '',
    'ISSUED BY': '',
    'RESPONSIBLE TECHNICIAN': '',
    'CARE_INSTRUCTIONS': []
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Yeni PDF generation hook'u
  const { isGenerating, progress, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();

  // Yıkama talimatları fotoğrafları listesi
  const careInstructionsList = [
    { id: 'wash_30', name: '30°C Yıkama', image: '30-derece.jpeg' },
    { id: 'wash_40', name: '40°C Yıkama', image: '40-derece.jpeg' },
    { id: 'wash_50', name: '50°C Yıkama', image: '50-derece.jpeg' },
    { id: 'wash_60', name: '60°C Yıkama', image: '60-derece.jpeg' },
    { id: 'cold_wash', name: 'Soğuk Yıkama', image: 'cold-wash.jpeg' },
    { id: 'hand_wash', name: 'El Yıkama', image: 'hand-wash.jpeg' },
    { id: 'machine_wash', name: 'Makine Yıkama', image: 'machine-wash.jpeg' },
    { id: 'delicate_wash', name: 'Narin Yıkama', image: 'delicate-wash.jpeg' },
    // { id: 'narin_yikama', name: 'Narin Yıkama (TR)', image: 'narin-yıkama.jpeg' },
    { id: 'wash_hot', name: 'Sıcak Yıkama', image: 'wash-hot.jpeg' },
    { id: 'do_not_wash', name: 'Yıkama Yapılmaz', image: 'do-not-wash.jpeg' },
    { id: 'normal', name: 'Normal Yıkama', image: 'normal.jpeg' },
    { id: 'do_not_bleach', name: 'Ağartma Yapılmaz', image: 'do-not-bleach.jpeg' },
    { id: 'p_bleach', name: 'P Ağartma', image: 'P.jpeg' },
    { id: 'dry_low_heat', name: 'Düşük Isıda Kurutma', image: 'dry-low-heat.jpeg' },
    { id: 'dry_medium_heat', name: 'Orta Isıda Kurutma', image: 'dry-medium-heat.jpeg' },
    { id: 'do_not_tumble', name: 'Makine Kurutma Yapılmaz', image: 'do-not-tumble.jpeg' },
    { id: 'dry_flat', name: 'Düz Kurutma', image: 'dry-flat.jpeg' },
    { id: 'low_heat', name: 'Düşük Isı', image: 'low-heat.jpeg' },
    { id: 'medium_heat', name: 'Orta Isı', image: 'medium-heat.jpeg' },
    { id: 'high_heat', name: 'Yüksek Isı', image: 'high-heat.jpeg' },
    // { id: 'low_iron', name: 'Düşük İsıda Ütüleme', image: 'low-iron.jpeg' },
    { id: 'utu', name: 'Ütüleme', image: 'utu.jpeg' },
    { id: 'buhar', name: 'Buhar', image: 'buhar.jpeg' },
    { id: 'do_not_iron', name: 'Ütüleme Yapılmaz', image: 'do-not-iron.jpeg' },
    { id: 'dry_clean', name: 'Kuru Temizleme', image: 'dry-clean.jpeg' },
    { id: 'do_not_dry_clean', name: 'Kuru Temizleme Yapılmaz', image: 'do-not-dry-clean.jpeg' },
    { id: 'any_solvent', name: 'Herhangi Çözücü', image: 'any-solvent.jpeg' },
    { id: 'cleaning_pce_delicate', name: 'PCE Narin Temizleme', image: 'cleaning-PCE-delicate.jpeg' },
    { id: 'cleaning_pce_very_delicate', name: 'PCE Çok Narin Temizleme', image: 'cleaning-PCE-very-delicate.jpeg' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = "${value}"`);
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      console.log('Updated form data:', updated);
      return updated;
    });
    setError('');
  };

  // Yıkama talimatları seçimi için fonksiyon
  const handleCareInstructionToggle = (instructionId) => {
    setFormData(prev => {
      const currentInstructions = prev['CARE_INSTRUCTIONS'] || [];
      const isSelected = currentInstructions.includes(instructionId);
      
      const updatedInstructions = isSelected
        ? currentInstructions.filter(id => id !== instructionId)
        : [...currentInstructions, instructionId];
      
      console.log('Updated care instructions:', updatedInstructions);
      
      return {
        ...prev,
        'CARE_INSTRUCTIONS': updatedInstructions
      };
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      console.log('Sending fabric technical data to backend:', formData);
      console.log('Notes specifically:', {
        NOTE_1: formData['NOTE_1'],
        NOTE_2: formData['NOTE_2'],
        NOTE_3: formData['NOTE_3']
      });

      // Yeni 3-aşamalı PDF generation kullan
      const success = await generatePDFWithHook(formData, 'fabric-technical', selectedLanguage);
      
      if (success) {
        setSuccess('Technical Sheet PDF başarıyla oluşturuldu ve indirildi!');
      }
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      setError(`PDF oluşturulamadı: ${error.message}`);
    }
  };

  const handleReset = () => {
    setFormData({
      'ARTICLE CODE': '',
      'CUSTOM TARIFF CODE': '',
      'COMPOSITION': '',
      'WEAW TYPE': '',
      'WEIGHT': '',
      'WIDTH / CUTABLE WIDTH': '',
      'CERTIFICATION': '',
      'CONSTRUCTION': '',
      'FINISH': '',
      'COLOUR': '',
      'JACQUARD PATTERN NAME': '',
      'ORIGIN': '',
      'SHRINKAGE IN WARP': '',
      'SHRINKAGE IN WEFT': '',
      'NOTE_1': '',
      'NOTE_2': '',
      'NOTE_3': '',
      'ISSUED BY': '',
      'RESPONSIBLE TECHNICIAN': '',
      'CARE_INSTRUCTIONS': []
    });
    setError('');
    setSuccess('');
  };

  return (
    <div className="fabric-form-container">
      <div className="fabric-form-header">
        <h2>TECHNICAL SHEET</h2>
        <p>Kumaş teknik bilgi formunu doldurun</p>
      </div>

      {/* Error & Success Messages */}
      {(error || pdfError) && (
        <div className="alert alert-error">
          <strong>Hata:</strong> {error || pdfError}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <strong>Başarılı:</strong> {success}
        </div>
      )}
      
      {/* Progress Message */}
      {progress && (
        <div className="progress-message">
          {progress}
        </div>
      )}

      <form onSubmit={handleSubmit} className="fabric-form">
        <div className="form-section">
          <h3 className="section-title">Teknik Bilgiler</h3>
          <div className="form-grid">
            {Object.keys(formData)
              .filter(fieldName => !fieldName.startsWith('NOTE_') && fieldName !== 'CARE_INSTRUCTIONS')
              .map((fieldName) => {
                // ISSUED BY ve RESPONSIBLE TECHNICIAN alanlarını ayrı bölümde gösteriyoruz, burada gösterme
                if (fieldName === 'ISSUED BY' || fieldName === 'RESPONSIBLE TECHNICIAN') {
                  return null;
                }
                
                return (
                <div key={fieldName} className="form-group">
                  <label htmlFor={fieldName} className="form-label">
                    {fieldName}:
                  </label>

                  {fieldName === 'WEAW TYPE' ? (
                    <select
                      id={fieldName}
                      name={fieldName}
                      value={formData[fieldName]}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isGenerating}
                    >
                      <option value="">Seçiniz...</option>
                      <option value="POPELINE">POPELINE</option>
                      <option value="PLAIN WEAVE">PLAIN WEAVE</option>
                      <option value="1X1 PLAIN">1X1 PLAIN</option>
                      <option value="1X1 POPELINE">1X1 POPELINE</option>
                      <option value="1X1 VUAL">1X1 VUAL</option>
                      <option value="TWILL 2/1">TWILL 2/1</option>
                      <option value="TWILL 2/1 S">TWILL 2/1 S</option>
                      <option value="TWILL 2/2">TWILL 2/2</option>
                      <option value="TWILL 3/1">TWILL 3/1</option>
                      <option value="TWILL 3/1 S">TWILL 3/1 S</option>
                      <option value="3/1 S DIAGONAL (DIMI)">3/1 S DIAGONAL</option>
                      <option value="3/1 Z DIAGONAL (DIMI)">3/1 Z DIAGONAL</option>
                      <option value="TWILL 4/1">TWILL 4/1</option>
                      <option value="SATIN">SATIN</option>
                      <option value="JACQUARD">JACQUARD</option>
                      <option value="HERRINGBONE">HERRINGBONE</option>
                      <option value="CREPE">CREPE</option>
                      <option value="DOBBY">DOBBY</option>
                      <option value="CANVAS">CANVAS</option>
                      <option value="BULL">BULL</option>
                      <option value="CHIFFON">CHIFFON</option>
                    </select>
                  ) : fieldName === 'FINISH' ? (
                    <select
                      id={fieldName}
                      name={fieldName}
                      value={formData[fieldName]}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isGenerating}
                    >
                      <option value="">Seçiniz...</option>
                      <option value="PFD">PFD</option>
                      <option value="DYED">DYED</option>
                      <option value="PIECE DYED">PIECE DYED</option>
                      <option value="REACTIVE DYED">REACTIVE DYED</option>
                      <option value="ENZYMATIC FINISH">ENZYMATIC FINISH</option>
                      <option value="COATED">COATED</option>
                      <option value="AERO">AERO</option>
                      <option value="NYLON TOUCH">NYLON TOUCH</option>
                      <option value="ANTIBACTERIAL">ANTIBACTERIAL</option>
                      <option value="SANFORIZATION">SANFORIZATION</option>
                      <option value="WATER REPELLENT">WATER REPELLENT</option>
                      <option value="WIND REPELLENT">WIND REPELLENT</option>
                      <option value="BRUSHED">BRUSHED</option>
                    </select>
                  ) : fieldName === 'CERTIFICATION' ? (
                    <select
                      id={fieldName}
                      name={fieldName}
                      value={formData[fieldName]}
                      onChange={handleInputChange}
                      className="form-input"
                      disabled={isGenerating}
                    >
                      <option value="">Seçiniz...</option>
                      <option value="GOTS">GOTS</option>
                      <option value="GRS">GRS</option>
                      <option value="OCS">OCS</option>
                      <option value="RCS">RCS</option>
                      <option value="EUROPEAN FLAX">EUROPEAN FLAX</option>
                      <option value="ECOVERO">ECOVERO</option>
                      <option value="LENZING">LENZING</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      id={fieldName}
                      name={fieldName}
                      value={formData[fieldName]}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder={`${fieldName} giriniz...`}
                      disabled={isGenerating}
                    />
                  )}
                </div>
                );
              })}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Notlar (İsteğe Bağlı)</h3>
          <div className="notes-grid">
            {['NOTE_1', 'NOTE_2', 'NOTE_3'].map((noteField, index) => (
              <div key={noteField} className="form-group">
                <label htmlFor={noteField} className="form-label">
                  {index + 1}. Not:
                </label>
                <textarea
                  id={noteField}
                  name={noteField}
                  value={formData[noteField]}
                  onChange={handleInputChange}
                  className="form-textarea"
                  placeholder={`${index + 1}. notu giriniz... (opsiyonel)`}
                  disabled={isGenerating}
                  rows="3"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Yıkama Talimatları</h3>
          <p className="section-description">PDF'de görünmesini istediğiniz yıkama talimatları sembollerini seçin:</p>
          <div className="care-instructions-grid">
            {careInstructionsList.map((instruction) => (
              <div key={instruction.id} className="care-instruction-item">
                <label className="care-instruction-label">
                  <input
                    type="checkbox"
                    checked={formData['CARE_INSTRUCTIONS'].includes(instruction.id)}
                    onChange={() => handleCareInstructionToggle(instruction.id)}
                    className="care-instruction-checkbox"
                    disabled={isGenerating}
                  />
                  <div className="care-instruction-content">
                    <div className="care-instruction-icon">
                      <img 
                        src={require(`../care-instructions/${instruction.image}`)}
                        alt={instruction.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div className="care-instruction-fallback" style={{display: 'none'}}>
                        📋
                      </div>
                    </div>
                    <span className="care-instruction-name">{instruction.name}</span>
                  </div>
                </label>
              </div>
            ))}
          </div>
          {formData['CARE_INSTRUCTIONS'].length > 0 && (
            <div className="selected-instructions">
              <h4>Seçilen Talimatlar ({formData['CARE_INSTRUCTIONS'].length}):</h4>
              <div className="selected-instructions-list">
                {formData['CARE_INSTRUCTIONS'].map(id => {
                  const instruction = careInstructionsList.find(item => item.id === id);
                  return instruction ? (
                    <span key={id} className="selected-instruction-tag">
                      {instruction.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3 className="section-title">İmza Bilgileri</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="ISSUED BY" className="form-label">
                ISSUED BY:
              </label>
              <input
                type="text"
                id="ISSUED BY"
                name="ISSUED BY"
                value={formData['ISSUED BY']}
                onChange={handleInputChange}
                className="form-input"
                placeholder="İmzalayan kişi giriniz..."
                disabled={isGenerating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="RESPONSIBLE TECHNICIAN" className="form-label">
                RESPONSIBLE TECHNICIAN:
              </label>
              <input
                type="text"
                id="RESPONSIBLE TECHNICIAN"
                name="RESPONSIBLE TECHNICIAN"
                value={formData['RESPONSIBLE TECHNICIAN']}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Sorumlu teknisyen giriniz..."
                disabled={isGenerating}
              />
            </div>
          </div>
        </div>

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

export default FabricTechnicalForm;
