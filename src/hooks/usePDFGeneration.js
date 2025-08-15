// hooks/usePDFGeneration.js
import { useState } from 'react';
import PDFService from '../services/pdfService';

export const usePDFGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const generatePDF = async (formData, docType, language = 'turkish') => {
    try {
      setIsGenerating(true);
      setError('');
      setProgress('PDF üretimi başlatılıyor...');

      // Fallback destekli PDF üretimi
      const success = await PDFService.generatePDFWithFallback(formData, docType, language);
      
      if (success) {
        setProgress('PDF başarıyla indirildi! (Demo modunda çalıştırılıyor)');
        setTimeout(() => setProgress(''), 5000);
        return true;
      } else {
        throw new Error('PDF üretimi başarısız oldu');
      }

    } catch (error) {
      const errorMessage = error.message.includes('Tüm sistemler devre dışı') 
        ? 'PDF servisleri şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
        : `Hata: ${error.message}`;
      
      setError(errorMessage);
      console.error('PDF generation error:', error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setProgress('');
  };

  return {
    isGenerating,
    progress,
    error,
    generatePDF,
    clearMessages
  };
};

export default usePDFGeneration;
