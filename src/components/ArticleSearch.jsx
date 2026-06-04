import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firebase/config';
import '../css/ArticleSearch.css';

/**
 * ArticleSearch — Reusable article autocomplete component
 * 
 * Props:
 *   value: string — current article number value
 *   onSelect: (article) => void — called when user selects a result
 *   onChange: (value) => void — called on manual input change
 *   placeholder: string — input placeholder
 *   inputType: 'input' | 'textarea' — render as input or textarea
 *   fabricWeightValue: string — current fabric weight value (for display)
 */
const ArticleSearch = ({ value, onSelect, onChange, placeholder, inputType = 'input', fabricWeightValue }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const wrapperRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAuthToken = async () => {
    try {
      const user = auth.currentUser;
      if (user) return await user.getIdToken();
      return null;
    } catch (error) {
      console.warn('Could not get auth token:', error);
      return null;
    }
  };

  const searchArticles = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(
        `${apiUrl}/api/articles/search?q=${encodeURIComponent(query)}`,
        { headers }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      const data = result.data || [];
      setSearchResults(Array.isArray(data) ? data : []);
      setShowDropdown(data.length > 0);
    } catch (error) {
      console.error('Article search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (onChange) onChange(val);

    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchArticles(val);
    }, 300);
  };

  const handleSelect = (article) => {
    setShowDropdown(false);
    setSearchResults([]);
    if (onSelect) onSelect(article);
  };

  const InputComponent = inputType === 'textarea' ? 'textarea' : 'input';

  return (
    <div className="article-search-wrapper" ref={wrapperRef}>
      <InputComponent
        type={inputType === 'input' ? 'text' : undefined}
        className={inputType === 'textarea' ? 'form-textarea' : 'form-input'}
        value={value || ''}
        onChange={handleInputChange}
        onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
        placeholder={placeholder || 'Article ara...'}
        rows={inputType === 'textarea' ? 1 : undefined}
      />
      {isLoading && <span className="article-search-loading">...</span>}

      {showDropdown && searchResults.length > 0 && (
        <div className="article-dropdown">
          {searchResults.map((article, idx) => (
            <div
              key={idx}
              className="article-dropdown-item"
              onClick={() => handleSelect(article)}
            >
              <div className="article-dropdown-main">{article.articleNumber}</div>
              {article.fabricWeightWidth && (
                <div className="article-dropdown-sub">{article.fabricWeightWidth}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleSearch;
