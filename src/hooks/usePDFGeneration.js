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

      // Production PDF üretimi
      const success = await PDFService.generatePDFWithFallback(formData, docType, language);
      
      if (success) {
        setProgress('PDF başarıyla indirildi!');
        setTimeout(() => setProgress(''), 3000);
        return true;
      } else {
        throw new Error('PDF üretimi başarısız oldu');
      }

    } catch (error) {
      setError(error.message);
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
