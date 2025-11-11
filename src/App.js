// src/App.js
import React, { useState } from 'react';
import SelectDocument from './components/SelectDocument';
import LanguageSelector from './components/LanguageSelector';
import DocumentForm from './components/DocumentForm';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');

  return (
    <PrivateRoute>
      <div className="app-container">
        <Header />
        
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
    </PrivateRoute>
  );
}

export default App;
