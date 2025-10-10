// src/components/LanguageSelector.jsx
import React from 'react';

const LanguageSelector = ({ selectedLanguage, setSelectedLanguage, selectedDocType }) => {
  // Sadece bir belge türü seçilmişse dil seçicisini göster
  if (!selectedDocType) {
    return null;
  }

  return (
    <div className="language-selector">
      <label htmlFor="language-select">Dil Seçimi:</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        required
      >
        <option value="">Dil Seçiniz</option>
        <option value="tr">Türkçe</option>
        <option value="en">İngilizce</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
