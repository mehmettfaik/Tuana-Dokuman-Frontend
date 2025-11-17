// src/components/Header.jsx
import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase/config';
import '../css/Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleExcelButtonClick = () => {
    // Dosya seçme dialogunu aç
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    setIsUploading(true);

    try {
      // Firebase token al
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : null;

      if (!token) {
        alert('Lütfen önce giriş yapın.');
        setIsUploading(false);
        return;
      }

      // FormData oluştur
      const formData = new FormData();
      
      // Tüm seçilen fotoğrafları FormData'ya ekle
      Array.from(files).forEach((file) => {
        formData.append('photos', file);
      });

      console.log('Excel oluşturma için fotoğraflar gönderiliyor...', {
        fileCount: files.length,
        fileNames: Array.from(files).map(f => f.name)
      });

      // Backend base URL: prefer env var, then current origin, then localhost
      const API_BASE = process.env.REACT_APP_API_URL || window.location.origin || 'http://localhost:3001';

      // Backend'e gönder
      const response = await fetch(`${API_BASE}/api/excel/create-from-photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Excel oluşturma cevabı:', result);

      // Başarı durumunda otomatik indirme (backend değişken formatlarına toleranslı)
      const downloadUrl = result?.data?.downloadUrl || result?.data?.excelPath || result?.downloadUrl || result?.excelPath || result?.excelUrl;
      const filename = result?.data?.filename || result?.data?.excelFilename || result?.filename || result?.excelFilename || 'export.xlsx';

      if (result && (result.success === true || result.success === undefined) && downloadUrl) {
        // Tam URL değilse API_BASE ile birleştir
        const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${API_BASE}${downloadUrl}`;
        console.log('Otomatik indirme başlatılıyor:', fullUrl);

        // Authorization token ile fetch yaparak dosyayı indir
        try {
          const downloadResponse = await fetch(fullUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (!downloadResponse.ok) {
            throw new Error(`Download failed: ${downloadResponse.status}`);
          }

          // Blob olarak al ve indir
          const blob = await downloadResponse.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const downloadLink = document.createElement('a');
          downloadLink.href = blobUrl;
          downloadLink.download = filename;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // Blob URL'ini temizle
          window.URL.revokeObjectURL(blobUrl);

          alert(`Excel dosyası oluşturuldu ve indirme başladı.\nToplam ${files.length} fotoğraf işlendi.`);
        } catch (downloadError) {
          console.error('Dosya indirme hatası:', downloadError);
          alert(`Dosya indirilirken hata oluştu: ${downloadError.message}`);
        }
      } else {
        // Eğer backend işlem tamamlandığını ama dosya vermediğini söylüyorsa, kullanıcıya bilgi ver
        console.warn('Excel oluşturuldu ancak download URL bulunamadı.', result);
        alert(`Excel oluşturuldu ancak indirme bağlantısı yok. Sunucudan dönen cevap: ${JSON.stringify(result)}`);
      }

      // Dosya inputunu temizle
      event.target.value = '';
      
    } catch (error) {
      console.error('Excel oluşturma hatası:', error);
      alert(`Excel oluşturulamadı: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-header">
      <div className="header-left">
        <img src="/logo192.png" alt="Tuana Tekstil" className="app-logo" />
      </div>
      
      {currentUser && (
        <div className="header-right">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <span className="user-email">{currentUser.email}</span>
          </div>
          
          {/* Excel Oluştur Butonu */}
          <button 
            className="excel-button" 
            onClick={handleExcelButtonClick}
            disabled={isUploading}
          >
            {isUploading ? 'Yükleniyor...' : '📊 Excel Oluştur'}
          </button>
          
          {/* Gizli dosya input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <button 
            className="logout-button" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;
