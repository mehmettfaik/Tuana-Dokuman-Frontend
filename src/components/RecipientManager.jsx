import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '../firebase/config';
import '../css/RecipientManager.css';


const RecipientManager = ({ onRecipientSelect, selectedRecipient }) => {
  const [recipients, setRecipients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    cityCountry: '',
    vat: '',
    contactPerson: '',
    phone: '',
    email: ''
  });

  // Helper to get auth token
  const getAuthToken = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        return await user.getIdToken();
      }
      return null;
    } catch (error) {
      console.warn('Could not get auth token:', error);
      return null;
    }
  };

  // API çağrıları
  const fetchRecipients = React.useCallback(async () => {
    try {
      const token = await getAuthToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch('/api/recipients', { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();      
      // Backend'den gelen yapı: {success: true, count: 3, data: [...]}
      const recipientsList = result.data || [];
      setRecipients(Array.isArray(recipientsList) ? recipientsList : []);
    } catch (error) {
      console.error('Backend hatası:', error.message);
      setRecipients([]);
    }
  }, []);

  const searchRecipients = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/recipients/search?q=${encodeURIComponent(query)}`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();      
      // Backend'den gelen yapı: {success: true, count: X, data: [...]}
      const searchData = result.data || [];
      setSearchResults(Array.isArray(searchData) ? searchData : []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Backend arama hatası:', error.message);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipient = async () => {
    // Form validasyonu
    if (!formData.companyName.trim()) {
      alert('Şirket adı zorunludur!');
      return;
    }

    try {      
      const recipientData = {
        companyName: formData.companyName.trim(),
        address: formData.address.trim(),
        cityStateCountry: formData.cityCountry.trim(),
        vat: formData.vat.trim(),
        contactPerson: formData.contactPerson.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim()
      };

      const url = editingRecipient 
        ? `/api/recipients/${editingRecipient.id}`
        : '/api/recipients';
      
      const method = editingRecipient ? 'PUT' : 'POST';

      const token = await getAuthToken();
      const headers = { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(recipientData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Kaydetme başarılı:', result); // Debug log
      
      // API başarılı - recipients listesini yenile
      await fetchRecipients();

      // Başarılı kaydetme sonrası işlemler
      closeModal();
      
      alert(editingRecipient ? 'Recipient başarıyla güncellendi!' : 'Yeni recipient başarıyla eklendi!');
      
    } catch (error) {
      console.error('Genel kaydetme hatası:', error);
      alert('Kaydetme sırasında hata oluştu: ' + error.message);
    }
  };

  const deleteRecipient = async (id) => {
    if (window.confirm('Bu recipient silinsin mi?')) {
      try {
        const token = await getAuthToken();
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(`/api/recipients/${id}`, {
          method: 'DELETE',
          headers
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log('Silme başarılı');
        await fetchRecipients();
        alert('Recipient başarıyla silindi!');
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Silme sırasında hata oluştu: ' + error.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      address: '',
      cityCountry: '',
      vat: '',
      contactPerson: '',
      phone: '',
      email: ''
    });
    setEditingRecipient(null);
  };

  const closeModal = React.useCallback(() => {
    setShowManageModal(false);
    resetForm();
  }, []);

  // Debounce timer için ref
  const searchTimeoutRef = React.useRef(null);

  // Event handlers
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Yeni timeout ayarla (300ms gecikme)
    searchTimeoutRef.current = setTimeout(() => {
      searchRecipients(value);
    }, 300);
  };

  const handleRecipientSelect = (recipient) => {
    setSearchTerm(recipient.companyName || '');
    setShowDropdown(false);
    onRecipientSelect(recipient);
  };

  const handleEditRecipient = (recipient) => {
    setFormData({
      companyName: recipient.companyName || '',
      address: recipient.address || '',
      cityCountry: recipient.cityStateCountry || '',
      vat: recipient.vat || '',
      contactPerson: recipient.contactPerson || '',
      phone: recipient.phone || '',
      email: recipient.email || ''
    });
    setEditingRecipient(recipient);
    setShowManageModal(true);
  };

  const handleAddNew = () => {
    resetForm();
    setShowDropdown(false); // Dropdown'u kapat
    setShowManageModal(true);
  };

  // Effects
  useEffect(() => {
    fetchRecipients();
  }, [fetchRecipients]);

  useEffect(() => {
    if (selectedRecipient) {
      setSearchTerm(selectedRecipient.companyName || '');
    }
  }, [selectedRecipient]);

  // Modal açıldığında body scroll'unu engelle ve ESC tuşunu dinle
  useEffect(() => {
    if (showManageModal) {
      document.body.style.overflow = 'hidden';
      
      // ESC tuşu ile kapatma
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [showManageModal, closeModal]);

  return (
    <div className="recipient-manager">
      <div className="recipient-search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            className="form-input recipient-search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Şirket adı ile arama yapın..."
            onFocus={() => searchTerm && setShowDropdown(true)}
          />
          {isLoading && <div className="search-loading">Aranıyor...</div>}
          
          {showDropdown && (
            <div className="recipient-dropdown">
              {searchResults.length > 0 ? (
                searchResults.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="recipient-dropdown-item"
                    onClick={() => handleRecipientSelect(recipient)}
                  >
                    <div className="recipient-company">{recipient.companyName}</div>
                    <div className="recipient-details">
                      {recipient.cityStateCountry} - {recipient.vat}
                    </div>
                  </div>
                ))
              ) : searchTerm.trim() && !isLoading ? (
                <div className="no-results">
                  <div>Sonuç bulunamadı</div>
                  <button 
                    className="btn btn-xs btn-primary"
                    onClick={handleAddNew}
                    style={{ marginTop: '5px' }}
                  >
                    "{searchTerm}" için yeni ekle
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="recipient-actions">
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={handleAddNew}
          >
            + Yeni Ekle
          </button>
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={() => {
              setShowDropdown(false); // Dropdown'u kapat
              setShowManageModal(true);
            }}
          >
            Yönet
          </button>
        </div>
      </div>

      {/* Yönetim Modal */}
      {showManageModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-content recipient-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingRecipient ? 'Recipient Düzenle' : 'Yeni Recipient Ekle'}</h3>
              <button 
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Şirket Adı</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    placeholder="Şirket adı"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Adres</label>
                  <textarea
                    className="form-textarea"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Şirket adresi"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">İlçe İl Ülke</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.cityCountry}
                    onChange={(e) => setFormData({...formData, cityCountry: e.target.value})}
                    placeholder="İlçe, İl, Ülke"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Vergi No</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.vat}
                    onChange={(e) => setFormData({...formData, vat: e.target.value})}
                    placeholder="Vergi numarası"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sorumlu Kişi</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                    placeholder="Sorumlu kişi"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefon</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Telefon numarası"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="E-posta adresi"
                  />
                </div>
              </div>

              {!editingRecipient && recipients.length > 0 && (
                <div className="existing-recipients">
                  <h4>Mevcut Recipients</h4>
                  <div className="recipients-list">
                    {recipients.map((recipient) => (
                      <div key={recipient.id} className="recipient-item">
                        <div className="recipient-info">
                          <strong>{recipient.companyName}</strong>
                          <span>{recipient.cityStateCountry}</span>
                        </div>
                        <div className="recipient-item-actions">
                          <button
                            className="btn btn-xs btn-secondary"
                            onClick={() => handleEditRecipient(recipient)}
                          >
                            Düzenle
                          </button>
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => deleteRecipient(recipient.id)}
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeModal}
              >
                İptal
              </button>
              <button
                className="btn btn-primary"
                onClick={saveRecipient}
                disabled={!formData.companyName.trim()}
              >
                {editingRecipient ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default RecipientManager;