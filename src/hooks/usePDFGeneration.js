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

      // 1. PDF üretimini başlat
      const jobId = await PDFService.startPDFGeneration(docType, formData, language);
      setProgress('PDF üretiliyor...');

      // 2. Tamamlanmasını bekle
      await PDFService.waitForPDFCompletion(
        jobId,
        (status) => {
          // Progress güncellemesi
          if (status.status === 'pending') {
            setProgress('PDF hazırlanıyor...');
          } else if (status.status === 'processing') {
            setProgress('PDF işleniyor...');
          }
        }
      );

      // 3. PDF'i indir
      setProgress('PDF indiriliyor...');
      const fileName = PDFService.generateFileName(docType, formData);
      await PDFService.downloadPDF(jobId, fileName);
      
      setProgress('PDF başarıyla indirildi!');
      setTimeout(() => setProgress(''), 3000);

      return true;

    } catch (error) {
      setError(`Hata: ${error.message}`);
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
