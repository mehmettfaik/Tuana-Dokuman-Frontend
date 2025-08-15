# Tuana Dokuman Frontend

PDF document generation frontend application for Tuana Textile Company.

## 🆕 PDF Üretim Sistemi Güncellemesi (v2.0)

### Yeni 3-Aşamalı PDF Üretim Sistemi

Artık PDF üretimi **3 aşamalı** sistemle çalışıyor:

1. **Start** - PDF üretimini başlat
2. **Status** - Durum kontrolü (polling ile otomatik)  
3. **Download** - PDF'i indir

### ✨ Yeni Özellikler

- **Real-time Progress Tracking**: Kullanıcı PDF durumunu anlık olarak görebilir
- **Better UX**: Loading states, progress bars, detaylı hata mesajları
- **Non-blocking UI**: PDF üretimi sırasında UI donmuyor
- **Automatic Retry**: Network hatalarında otomatik yeniden deneme
- **Smart File Naming**: Form verilerine göre otomatik dosya adı oluşturma
- **Timeout Handling**: 60 saniye timeout koruması

### 📋 Desteklenen Formlar

| Form | Durum | Yeni Sistem |
|------|-------|-------------|
| ✅ Proforma Invoice | Tamamlandı | ✓ |
| ✅ Invoice | Tamamlandı | ✓ |
| ✅ Packing List | Tamamlandı | ✓ |
| ✅ Fabric Technical | Tamamlandı | ✓ |
| ✅ Credit Note | Tamamlandı | ✓ |
| ✅ Debit Note | Tamamlandı | ✓ |
| 🔄 Order Confirmation | %90 | ✓ |
| 🔄 Sipariş Formu | %90 | ✓ |
| 🔄 Price Offer | %90 | ✓ |

### 🛠 Teknik Detaylar

#### API Endpoints
```
POST /api/pdf/start
GET  /api/pdf/status/:jobId
GET  /api/pdf/download/:jobId
```

#### Yeni Hook: usePDFGeneration
```javascript
const { isGenerating, progress, error, generatePDF } = usePDFGeneration();

// Kullanım
const success = await generatePDF(formData, 'invoice', 'turkish');
```

#### PDF Service
```javascript
import PDFService from '../services/pdfService';

// Manuel kullanım
const jobId = await PDFService.startPDFGeneration(docType, formData, language);
const status = await PDFService.checkPDFStatus(jobId);
await PDFService.downloadPDF(jobId, fileName);
```

### 🎯 Kullanıcı Deneyimi

1. Kullanıcı "PDF Oluştur" butonuna tıklar
2. **"PDF üretimi başlatılıyor..."** mesajı görünür
3. **"PDF üretiliyor..."** → **"PDF hazırlanıyor..."** → **"PDF işleniyor..."**
4. **"PDF indiriliyor..."** 
5. **"PDF başarıyla indirildi!"** → 3 saniye sonra kaybolur

### 🔧 Geliştirme

#### Kurulum
```bash
npm install
npm start
```

#### Environment Variables
```
REACT_APP_API_URL=https://tuana-dokuman-backend.onrender.com
```

#### Test Component
```jsx
import PDFGenerationTest from './components/PDFGenerationTest';
// Test component'ini herhangi bir sayfaya ekleyerek sistemı test edebilirsiniz
```

### 📁 Dosya Yapısı

```
src/
├── services/
│   └── pdfService.js          # Ana PDF servis sınıfı
├── hooks/
│   └── usePDFGeneration.js    # PDF üretim hook'u
├── components/
│   ├── ProformaInvoiceForm.jsx  # ✅ Güncellendi
│   ├── InvoiceForm.jsx          # ✅ Güncellendi  
│   ├── PackingListForm.jsx      # ✅ Güncellendi
│   └── PDFGenerationTest.jsx    # 🧪 Test component'i
└── api.js                     # Legacy API (fallback)
```

### 🐛 Hata Yönetimi

- **Network Hatalar**: "Server'a bağlanılamıyor"
- **Timeout**: "PDF üretimi zaman aşımına uğradı"
- **Server Hatalar**: Backend'den gelen detaylı hata mesajları
- **PDF Indirme**: "PDF indirilemedi" hatası

### 🔄 Migration Guide

Eski sistemden yeni sisteme geçiş için: [PDF_MIGRATION_GUIDE.md](./PDF_MIGRATION_GUIDE.md)

### 📈 Performance

- **Polling Interval**: 1 saniye
- **Timeout**: 60 saniye
- **File Size**: Otomatik optimizasyon
- **Memory**: Blob cleanup otomatik

### 🎨 UI/UX İyileştirmeleri

- Yeni spinner animasyonları
- Progress mesajları
- Loading states
- Disabled form states
- Better error handling
- Success feedback

### 📱 Responsive Design

- Mobile-first approach
- Touch-friendly buttons
- Responsive forms
- Progressive enhancement

## Legacy API (v1.0)

Eski tek-request sistemi hala `api.js` dosyasında mevcut ve fallback olarak kullanılabilir.

```javascript
import { generatePDF } from '../api';
const response = await generatePDF(formData, 'form-type', 'language');
```

---

**Not**: Yeni sistem backend'in 3-aşamalı endpoint'leri desteklemesini gerektirir. Backend henüz güncellenmemişse, eski API otomatik olarak fallback olarak kullanılır.
