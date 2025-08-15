// components/PDFGenerationTest.jsx
import React, { useState } from 'react';
import usePDFGeneration from '../hooks/usePDFGeneration';

const PDFGenerationTest = () => {
  const { isGenerating, progress, error, generatePDF } = usePDFGeneration();
  const [formData] = useState({
    'ARTICLE CODE': 'TEST-001',
    'COMPOSITION': 'Test Fabric',
    'WEIGHT': '150 GSM',
    'WIDTH / CUTABLE WIDTH': '150 cm',
    'CERTIFICATION': 'OEKO-TEX',
    'CONSTRUCTION': 'Plain Weave',
    'FINISH': 'Brushed',
    'COLOUR': 'Navy Blue',
    'ORIGIN': 'Turkey',
    'ISSUED BY': 'Test Company',
    'RESPONSIBLE TECHNICIAN': 'John Doe'
  });

  const handleTestPDF = async () => {
    await generatePDF(formData, 'fabric-technical', 'turkish');
  };

  return (
    <div style={{ 
      padding: '2rem', 
      border: '2px solid #2196f3', 
      borderRadius: '8px', 
      margin: '1rem',
      backgroundColor: '#f8f9fa'
    }}>
      <h3>🧪 PDF Üretim Test Component'i</h3>
      <p>Bu component yeni 3-aşamalı PDF üretim sistemini test eder.</p>
      
      {error && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          ❌ Hata: {error}
        </div>
      )}
      
      {progress && (
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          color: '#1976d2',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          ⏳ {progress}
        </div>
      )}
      
      <button
        onClick={handleTestPDF}
        disabled={isGenerating}
        style={{
          background: isGenerating ? '#ccc' : '#2196f3',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '4px',
          cursor: isGenerating ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        {isGenerating ? '🔄 PDF Üretiliyor...' : '📄 Test PDF Oluştur'}
      </button>
      
      {isGenerating && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '1rem'
        }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            animation: 'spin 2s linear infinite'
          }}></div>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', fontSize: '14px', color: '#666' }}>
        <strong>Test verileri:</strong>
        <pre style={{ background: '#eee', padding: '8px', borderRadius: '4px', marginTop: '8px' }}>
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PDFGenerationTest;
