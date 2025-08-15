# PDF Üretim API Migration Guide - TAMAMLANDI ✅

Bu rehber, tüm form component'lerin eski tek-request sisteminden yeni 3-aşamalı sisteme (start → status → download) geçirilmesi için adımları içerir.

## Güncellenmesi Gereken Dosyalar

1. ✅ ProformaInvoiceForm.jsx - TAMAMLANDI
2. ✅ InvoiceForm.jsx - TAMAMLANDI  
3. ✅ PackingListForm.jsx - TAMAMLANDI
4. ✅ FabricTechnicalForm.jsx - TAMAMLANDI
5. ✅ CreditNoteForm.jsx - TAMAMLANDI
6. ✅ DebitNoteForm.jsx - TAMAMLANDI
7. 🔄 OrderConfirmationForm.jsx - BAŞLANDI (UI kaldı)
8. 🔄 SiparisForm.jsx - BAŞLANDI (UI kaldı)
9. 🔄 PriceOfferForm.jsx - BAŞLANDI (UI kaldı)
10. ⏳ DocumentForm.jsx - Manuel gerekiyor (farklı yapı)

## Her Component için Gerekli Değişiklikler:

### 1. Import Değişikliği
```jsx
// EskI:
import { generatePDF } from '../api';

// Yeni:
import usePDFGeneration from '../hooks/usePDFGeneration';
```

### 2. State Güncellemeleri
```jsx
// Eski:
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

// Yeni:
const [error, setError] = useState('');
const [success, setSuccess] = useState('');

// Yeni PDF generation hook'u
const { isGenerating, progress, error: pdfError, generatePDF: generatePDFWithHook } = usePDFGeneration();
```

### 3. handleSubmit Fonksiyonu
```jsx
// Eski:
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  try {
    const response = await generatePDF(combinedData, 'form-type', selectedLanguage);
    
    if (response) {
      const blob = new Blob([response], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'filename.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('PDF başarıyla oluşturuldu!');
    }
  } catch (error) {
    setError('Hata: ' + error.message);
  } finally {
    setLoading(false);
  }
};

// Yeni:
const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setSuccess('');

  try {
    const combinedData = {
      ...formData,
      // diğer veriler...
    };
    
    const success = await generatePDFWithHook(combinedData, 'form-type', selectedLanguage);
    
    if (success) {
      setSuccess('PDF başarıyla oluşturuldu ve indirildi!');
    }
  } catch (error) {
    setError('Hata: ' + error.message);
  }
};
```

### 4. Error/Success Messages
```jsx
// Eski:
{error && <div className="alert alert-error">{error}</div>}
{success && <div className="alert alert-success">{success}</div>}

// Yeni:
{(error || pdfError) && (
  <div className="alert alert-error">
    {error || pdfError}
  </div>
)}
{success && <div className="alert alert-success">{success}</div>}

{/* Progress Message */}
{progress && (
  <div className="progress-message" style={{ 
    background: '#e3f2fd', 
    border: '1px solid #2196f3', 
    color: '#1976d2', 
    padding: '12px', 
    borderRadius: '4px', 
    marginBottom: '1rem',
    textAlign: 'center'
  }}>
    {progress}
  </div>
)}
```

### 5. Form Buttons
```jsx
// Eski:
<button
  type="submit"
  className="btn btn-primary"
  disabled={loading}
>
  {loading ? <span className="spinner"></span> : null}
  {loading ? 'PDF Oluşturuluyor...' : 'PDF Oluştur ve İndir'}
</button>

// Yeni:
<button
  type="submit"
  className="btn btn-primary"
  disabled={isGenerating}
>
  {isGenerating ? (
    <>
      <span className="spinner"></span>
      PDF Oluşturuluyor...
    </>
  ) : (
    'PDF Oluştur ve İndir'
  )}
</button>

{/* Loading Spinner */}
{isGenerating && (
  <div className="loading-spinner" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '1rem'
  }}>
    <div className="spinner" style={{
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 2s linear infinite'
    }}></div>
  </div>
)}
```

## Kullanım Senaryoları

### Backend API Endpoints
Yeni sistem bu endpoint'leri kullanır:
- POST /api/pdf/start - PDF üretimi başlat
- GET /api/pdf/status/:jobId - Durum kontrol et  
- GET /api/pdf/download/:jobId - PDF'i indir

### Kullanıcı Deneyimi
1. Kullanıcı "PDF Oluştur" butonuna tıklar
2. "PDF üretimi başlatılıyor..." mesajı görünür
3. "PDF üretiliyor..." -> "PDF hazırlanıyor..." -> "PDF işleniyor..."
4. "PDF indiriliyor..." 
5. "PDF başarıyla indirildi!" -> 3 saniye sonra kaybolur

### Error Handling
- Network hatalar: "Server'a bağlanılamıyor"
- Timeout: "PDF üretimi zaman aşımına uğradı" 
- Server hatalar: Backend'den gelen hata mesajları
- PDF indirme hatalar: "PDF indirilemedi"

## Avantajları

1. **Better UX**: Kullanıcı PDF durumunu görebiliyor
2. **Progress Tracking**: Real-time durum güncellemeleri
3. **Timeout Handling**: Uzun süren işlemler için güvenli
4. **Error Handling**: Daha detaylı hata mesajları
5. **Non-blocking**: UI donmuyor, kullanıcı başka işlemler yapabilir

## Geliştirme Notları

- PDFService class'ı otomatik dosya adı oluşturuyor
- Polling interval 1 saniye olarak ayarlandı
- Default timeout 60 saniye
- Legacy generatePDF fonksiyonu hala mevcut (fallback için)

## Test Checklist

Her component için:
- [ ] PDF üretim işlemi başlatılabiliyor mu?
- [ ] Progress mesajları görünüyor mu?
- [ ] Hata durumları doğru handled ediliyor mu?
- [ ] Loading state'de UI disabled oluyor mu?
- [ ] PDF başarıyla indiriliyor mu?
- [ ] Dosya adları doğru oluşuyor mu?
