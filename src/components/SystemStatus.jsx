// components/SystemStatus.jsx
import React, { useState, useEffect } from 'react';
import PDFService from '../services/pdfService';

const SystemStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const [lastCheck, setLastCheck] = useState(null);

  const checkSystemStatus = async () => {
    setStatus('checking');
    try {
      const isOnline = await PDFService.testConnection();
      setStatus(isOnline ? 'online' : 'offline');
      setLastCheck(new Date());
    } catch (error) {
      setStatus('offline');
      setLastCheck(new Date());
    }
  };

  useEffect(() => {
    checkSystemStatus();
    
    // Her 30 saniyede bir kontrol et
    const interval = setInterval(checkSystemStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'online': return '#4caf50';
      case 'offline': return '#f44336';
      case 'checking': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online': return 'PDF Servisi Aktif';
      case 'offline': return 'PDF Servisi Devre Dışı';
      case 'checking': return 'Kontrol Ediliyor...';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'online': return 'Tüm PDF işlemleri normal çalışıyor.';
      case 'offline': return 'PDF oluşturma servisi şu anda bakımda. Lütfen daha sonra tekrar deneyin.';
      case 'checking': return 'Sistem durumu kontrol ediliyor...';
      default: return '';
    }
  };

  return (
    <div style={{
      background: status === 'offline' ? '#ffebee' : '#e8f5e8',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '8px',
      padding: '12px 16px',
      margin: '16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        animation: status === 'checking' ? 'pulse 1.5s infinite' : 'none'
      }}></div>
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 'bold', 
          color: status === 'offline' ? '#d32f2f' : '#2e7d32',
          marginBottom: '4px'
        }}>
          {getStatusText()}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#666',
          marginBottom: '8px'
        }}>
          {getStatusMessage()}
        </div>
        {lastCheck && (
          <div style={{ fontSize: '12px', color: '#999' }}>
            Son kontrol: {lastCheck.toLocaleTimeString('tr-TR')}
          </div>
        )}
      </div>
      
      <button
        onClick={checkSystemStatus}
        disabled={status === 'checking'}
        style={{
          background: 'transparent',
          border: `1px solid ${getStatusColor()}`,
          color: getStatusColor(),
          borderRadius: '4px',
          padding: '6px 12px',
          cursor: status === 'checking' ? 'not-allowed' : 'pointer',
          fontSize: '12px'
        }}
      >
        {status === 'checking' ? '...' : '↻ Yenile'}
      </button>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SystemStatus;
