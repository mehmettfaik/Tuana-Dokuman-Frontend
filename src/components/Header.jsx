// src/components/Header.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
