// src/App.js
import React, { useState } from 'react';
import DocumentForm from './components/DocumentForm';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import Announcements from './components/Announcements';
import WarehouseView from './components/WarehouseView';
import './App.css';

function App() {
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [globalLang, setGlobalLang] = useState('en');

  const handleDocumentSelect = (docType, language) => {
    setSelectedDocType(docType);
    setSelectedLanguage(language);
  };

  const handleGlobalLangToggle = () => {
    setGlobalLang(prev => prev === 'tr' ? 'en' : 'tr');
  };

  return (
    <PrivateRoute>
      <div className="app-container">
        <Header
          onDocumentSelect={handleDocumentSelect}
          selectedDocType={selectedDocType}
          selectedLanguage={selectedLanguage}
          globalLang={globalLang}
          onGlobalLangToggle={handleGlobalLangToggle}
        />
        
        <div className="app-content">
          {selectedDocType === 'warehouse1-2' ? (
            <WarehouseView globalLang={globalLang} />
          ) : selectedDocType && selectedLanguage ? (
            <div className="document-form">
              <DocumentForm 
                selectedDocType={selectedDocType} 
                selectedLanguage={selectedLanguage}
                setSelectedLanguage={setSelectedLanguage}
              />
            </div>
          ) : (
            <Announcements globalLang={globalLang} />
          )}
        </div>
      </div>
    </PrivateRoute>
  );
}

export default App;
