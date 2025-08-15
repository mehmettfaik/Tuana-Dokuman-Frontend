// src/App.js
import React, { useState } from 'react';
import SelectDocument from './components/SelectDocument';
import LanguageSelector from './components/LanguageSelector';
import DocumentForm from './components/DocumentForm';
import './App.css';

function App() {
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  return (
    <div className="app-container">
      <div className="app-header">
        <h2>TUANA TEKSTİL - Dijital Belge Oluşturucu</h2>
        <p>Belgelerinizi dijital olarak oluşturun ve indirin</p>
      </div>
      
      <div className="app-content">
        <div className="document-selector">
          <SelectDocument
            selectedDocType={selectedDocType}
            setSelectedDocType={setSelectedDocType}
          />
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            selectedDocType={selectedDocType}
          />
        </div>
        
        {selectedDocType && selectedLanguage && (
          <div className="document-form">
            <DocumentForm 
              selectedDocType={selectedDocType} 
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
