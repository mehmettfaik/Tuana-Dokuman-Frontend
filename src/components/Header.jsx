// src/components/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import '../css/Header.css';

const Header = ({ onDocumentSelect, selectedDocType, selectedLanguage, globalLang, onGlobalLangToggle }) => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [pendingDocType, setPendingDocType] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const fileInputRef = useRef(null);
  const navRef = useRef(null);
  const userMenuRef = useRef(null);

  // Navigation menu structure
  const menuItems = {
    accounting: {
      label: { tr: 'MUHASEBE', en: 'ACCOUNTING' },
      items: [
        { key: 'proformaInvoice', label: { tr: 'PROFORMA FATURA', en: 'PROFORMA INVOICE' } },
        { key: 'invoice', label: { tr: 'FATURA', en: 'INVOICE' } },
        { key: 'priceOffer', label: { tr: 'FİYAT TEKLİFİ', en: 'PRICE OFFER' } },
        { key: 'creditNote', label: { tr: 'KREDİ NOTU', en: 'CREDIT NOTE' } },
        { key: 'debitNote', label: { tr: 'BORÇ NOTU', en: 'DEBIT NOTE' } },
      ]
    },
    warehouse: {
      label: { tr: 'DEPO', en: 'WAREHOUSE' },
      items: [
        { key: 'warehouse1-2', label: { tr: 'WAREHOUSE1&2', en: 'WAREHOUSE1&2' } },
        { key: 'packingList', label: { tr: 'PAKETLEME LİSTESİ', en: 'PACKING LIST' } },
        { key: 'cekiListesi', label: { tr: 'ÇEKİ LİSTESİ', en: 'ÇEKİ LİSTESİ' } },
        { key: 'hangersShipment', label: { tr: 'ASKILI SEVKİYAT', en: 'HANGERS SHIPMENT' } },
      ]
    },
    archive: {
      label: { tr: 'ARŞİV', en: 'ARCHIVE' },
      items: [
        { key: 'archiveLink', label: { tr: 'ARŞİV DOSYASI', en: 'ARCHIVE FILE' } },
      ]
    },
    general: {
      label: { tr: 'GENEL', en: 'GENERAL' },
      items: [
        { key: 'teknikFoy', label: { tr: 'TEKNİK FÖY', en: 'TECHNICAL SHEET' } },
        { key: 'orderConfirmation', label: { tr: 'SİPARİŞ ONAYI', en: 'ORDER CONFIRMATION' } },
        { key: 'siparis', label: { tr: 'SİPARİŞ FORMU', en: 'SİPARİŞ FORMU' } },
        { key: 'qualityControl', label: { tr: 'KALİTE KONTROL', en: 'QUALITY CONTROL' } },
      ]
    },
    marketing: {
      label: { tr: 'PAZARLAMA', en: 'MARKETING' },
      items: [
        { key: 'mailAutomation', label: { tr: 'Mail Otomasyonu', en: 'Mail Automation' } },
      ]
    }
  };

  // Removed local headerLang state, using globalLang from props

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    if (window.confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      setIsLoggingOut(true);
      try {
        await logout();
      } catch (error) {
        console.error('Logout error:', error);
        alert('Çıkış yapılırken bir hata oluştu.');
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handleDropdownToggle = (menuKey) => {
    setActiveDropdown(activeDropdown === menuKey ? null : menuKey);
  };

  const handleMenuItemClick = (docType) => {
    setActiveDropdown(null);
    if (docType === 'warehouse1-2') {
      window.open('https://docs.google.com/spreadsheets/d/1SrKeaEVLY4ttTk5Jf9jnqeWx5dh_4i60YDa6ZuOLuuw/edit?usp=sharing', '_blank');
    } else if (docType === 'archiveLink') {
      window.open('https://docs.google.com/spreadsheets/d/15wOeZArfDV60lRdXiuVRF0rGgxF9Gme8nalnyGbhtlc/edit?usp=sharing', '_blank');
    } else if (docType === 'mailAutomation') {
      window.open('https://tuana-mail-otomasyonu.vercel.app/', '_blank');
    } else {
      setPendingDocType(docType);
      setShowLanguageModal(true);
    }
  };

  const handleLanguageSelect = (lang) => {
    setShowLanguageModal(false);
    if (onDocumentSelect) {
      onDocumentSelect(pendingDocType, lang);
    }
    setPendingDocType(null);
  };

  const handleLanguageModalClose = () => {
    setShowLanguageModal(false);
    setPendingDocType(null);
  };

  const toggleHeaderLang = () => {
    if (onGlobalLangToggle) onGlobalLangToggle();
  };

  // Excel upload logic (preserved from original)
  const handleExcelButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;
      if (!token) {
        alert('Lütfen önce giriş yapın.');
        setIsUploading(false);
        return;
      }

      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('photos', file);
      });

      const API_BASE = process.env.REACT_APP_API_URL || window.location.origin || 'http://localhost:3001';

      const response = await fetch(`${API_BASE}/api/excel/create-from-photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const downloadUrl = result?.data?.downloadUrl || result?.data?.excelPath || result?.downloadUrl || result?.excelPath || result?.excelUrl;
      const filename = result?.data?.filename || result?.data?.excelFilename || result?.filename || result?.excelFilename || 'export.xlsx';

      if (result && (result.success === true || result.success === undefined) && downloadUrl) {
        const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE}${downloadUrl}`;
        try {
          const downloadResponse = await fetch(fullUrl, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!downloadResponse.ok) throw new Error(`Download failed: ${downloadResponse.status}`);
          const blob = await downloadResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(blobUrl);
          alert(`Excel dosyası oluşturuldu ve indirme başladı.\nToplam ${files.length} fotoğraf işlendi.`);
        } catch (downloadError) {
          console.error('Dosya indirme hatası:', downloadError);
          alert(`Dosya indirilirken hata oluştu: ${downloadError.message}`);
        }
      } else {
        console.warn('Excel oluşturuldu ancak download URL bulunamadı.', result);
        alert(`Excel oluşturuldu ancak indirme bağlantısı yok.`);
      }
      event.target.value = '';
    } catch (error) {
      console.error('Excel oluşturma hatası:', error);
      alert(`Excel oluşturulamadı: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Find which category/item is currently selected
  const getActiveInfo = () => {
    if (!selectedDocType) return null;
    for (const [catKey, cat] of Object.entries(menuItems)) {
      const item = cat.items.find(i => i.key === selectedDocType);
      if (item) return { catKey, item };
    }
    return null;
  };

  const activeInfo = getActiveInfo();

  return (
    <>
      <header className="main-header">
        <div className="header-inner">
          {/* Logo */}
          <div
            className="header-logo"
            onClick={() => onDocumentSelect && onDocumentSelect(null, null)}
            style={{ cursor: 'pointer' }}
          >
            <img src="/logo192.png" alt="Tuana Tekstil" className="logo-img" />
          </div>

          {/* Navigation */}
          {currentUser && (
            <nav className="header-nav" ref={navRef}>
              {Object.entries(menuItems).map(([key, menu]) => (
                <div
                  key={key}
                  className={`nav-item ${activeDropdown === key ? 'active' : ''} ${activeInfo?.catKey === key ? 'current' : ''}`}
                >
                  <button
                    className="nav-button"
                    onClick={() => handleDropdownToggle(key)}
                  >
                    {menu.label[globalLang]}
                    <span className={`nav-arrow ${activeDropdown === key ? 'open' : ''}`}>
                      <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>

                  {/* Dropdown */}
                  <div className={`nav-dropdown ${activeDropdown === key ? 'show' : ''}`}>
                    {menu.items.map((item) => (
                      <button
                        key={item.key}
                        className={`dropdown-item ${selectedDocType === item.key ? 'selected' : ''}`}
                        onClick={() => handleMenuItemClick(item.key)}
                      >
                        <span className="dropdown-dash">–</span>
                        {item.label[globalLang]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          )}

          {/* Right section: Lang toggle + User */}
          <div className="header-actions">
            {/* Language Toggle */}
            <button className="lang-toggle" onClick={toggleHeaderLang}>
              <span className={globalLang === 'tr' ? 'lang-active' : ''}>TR</span>
              <span className="lang-divider">/</span>
              <span className={globalLang === 'en' ? 'lang-active' : ''}>EN</span>
            </button>

            {currentUser && (
              <>
                {/* Excel Button */}
                <button
                  className="header-icon-btn excel-btn"
                  onClick={handleExcelButtonClick}
                  disabled={isUploading}
                  title="Excel Oluştur"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  {isUploading && <span className="btn-spinner"></span>}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {/* User Menu */}
                <div className="user-menu-wrapper" ref={userMenuRef}>
                  <button
                    className="header-icon-btn user-btn"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-email">{currentUser.email}</div>
                      <div className="user-dropdown-divider"></div>
                      <button
                        className="user-dropdown-logout"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active document breadcrumb */}
        {activeInfo && selectedLanguage && (
          <div className="header-breadcrumb">
            <span className="breadcrumb-cat">
              {menuItems[activeInfo.catKey].label[globalLang]}
            </span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-item">
              {activeInfo.item.label[globalLang]}
            </span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-lang">
              {selectedLanguage === 'tr' ? 'Türkçe' : 'English'}
            </span>
          </div>
        )}
      </header>

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="lang-modal-overlay" onClick={handleLanguageModalClose}>
          <div className="lang-modal" onClick={(e) => e.stopPropagation()}>
            <button className="lang-modal-close" onClick={handleLanguageModalClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <h3 className="lang-modal-title">
              {globalLang === 'tr' ? 'Dil Seçimi' : 'Select Language'}
            </h3>
            <p className="lang-modal-subtitle">
              {globalLang === 'tr'
                ? 'Belge dilini seçiniz'
                : 'Choose the document language'}
            </p>
            <div className="lang-modal-options">
              <button
                className="lang-option"
                onClick={() => handleLanguageSelect('tr')}
              >
                <span className="lang-option-label">Turkish</span>
              </button>
              <button
                className="lang-option"
                onClick={() => handleLanguageSelect('en')}
              >
                <span className="lang-option-label">English</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
