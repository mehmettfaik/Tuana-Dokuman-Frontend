import React, { useState, useEffect } from 'react';
import { api } from '../api';
import '../css/Announcements.css';

const Announcements = ({ globalLang }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const isTr = globalLang === 'tr';

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements');
      setAnnouncements(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError(isTr ? 'Duyurular yüklenemedi.' : 'Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalLang]);

  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        content: newContent,
        date: new Date().toISOString().split('T')[0]
      };
      const res = await api.post('/api/announcements', payload);
      setAnnouncements([res.data, ...announcements]);
      setNewContent('');
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to add announcement:', err);
      setError(isTr ? 'Duyuru eklenemedi. Lütfen tekrar deneyin.' : 'Failed to add announcement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    const message = isTr ? 'Bu duyuruyu silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this announcement?';
    if (!window.confirm(message)) return;
    
    try {
      await api.delete(`/api/announcements/${id}`);
      setAnnouncements(announcements.filter(a => a.id !== id));
      setError(null);
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setError(isTr ? 'Duyuru silinemedi.' : 'Failed to delete announcement.');
    }
  };

  return (
    <div className="announcements-container">
      <div className="announcements-header-row">
        <div className="announcements-header">
          <h2>{isTr ? 'DUYURULAR' : 'ANNOUNCEMENTS'}</h2>
        </div>
        <button 
          className={`btn-toggle-form ${showAddForm ? 'active' : ''}`}
          onClick={() => setShowAddForm(!showAddForm)}
          title={isTr ? 'Yeni Duyuru Ekle' : 'Add New Announcement'}
        >
          {showAddForm ? '−' : '+'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showAddForm && (
        <div className="add-announcement-section">
          <form onSubmit={handleAddAnnouncement} className="add-announcement-form">
            <textarea
              className="announcement-input"
              placeholder={isTr ? 'Yeni bir duyuru yazın...' : 'Write a new announcement...'}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
            <button 
              type="submit" 
              className="btn-add-announcement"
              disabled={isSubmitting || !newContent.trim()}
            >
              {isSubmitting 
                ? (isTr ? 'Ekleniyor...' : 'Adding...') 
                : (isTr ? 'Duyuru Ekle' : 'Add Announcement')}
            </button>
          </form>
        </div>
      )}

      <div className="announcements-list">
        {loading ? (
          <div className="loading-indicator">{isTr ? 'Yükleniyor...' : 'Loading...'}</div>
        ) : announcements.length === 0 ? (
          <div className="no-announcements">{isTr ? 'Henüz duyuru bulunmuyor.' : 'No announcements yet.'}</div>
        ) : (
          announcements.map((item) => (
            <div key={item.id} className="announcement-item">
              <div className="announcement-date">
                {new Date(item.date).toLocaleDateString(isTr ? 'tr-TR' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <div className="announcement-content">{item.content}</div>
              <button 
                className="btn-delete-announcement"
                onClick={() => handleDeleteAnnouncement(item.id)}
                title={isTr ? 'Duyuruyu Sil' : 'Delete Announcement'}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Announcements;
