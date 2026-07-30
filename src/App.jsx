// src/App.jsx
import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

const DocumentForm = lazy(() => import('./components/DocumentForm'));
const Announcements = lazy(() => import('./components/Announcements'));
const WarehouseView = lazy(() => import('./components/WarehouseView'));

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [globalLang, setGlobalLang] = useState('en');

  const handleGlobalLangToggle = () => {
    setGlobalLang(prev => prev === 'tr' ? 'en' : 'tr');
  };

  return (
    <PrivateRoute>
      <div className="app-container">
        <Header
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          globalLang={globalLang}
          onGlobalLangToggle={handleGlobalLangToggle}
        />
        
        <div className="app-content">
          <Suspense fallback={<div className="loading-spinner">Yükleniyor...</div>}>
            <Routes>
              <Route path="/" element={<Announcements globalLang={globalLang} />} />
              <Route path="/warehouse1-2" element={<WarehouseView globalLang={globalLang} />} />
              <Route 
                path="/docs/:docType" 
                element={
                  <div className="document-form">
                    <DocumentForm 
                      selectedLanguage={selectedLanguage}
                      setSelectedLanguage={setSelectedLanguage}
                    />
                  </div>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </PrivateRoute>
  );
}

export default App;
