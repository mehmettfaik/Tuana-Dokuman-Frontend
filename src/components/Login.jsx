// src/components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, setError } = useAuth();

  // Sayfa yüklendiğinde localStorage'dan email'i oku
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Lütfen email ve şifre giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      
      // Başarılı giriş - Beni hatırla seçiliyse email'i kaydet
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      // Başarılı giriş - AuthContext otomatik olarak yönlendirecek
    } catch (err) {
      // Hata mesajı AuthContext'te set edildi
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/logo192.png" alt="Tuana Tekstil" className="login-logo" />
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email adresinizi girin"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Şifre</label>
            <input
              type="password"
              id="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrenizi girin"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <div className="remember-me-group">
            <label className="remember-me-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span className="remember-me-text">Beni Hatırla</span>
            </label>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-small"></span>
                Giriş Yapılıyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="login-footer">
        </div>
      </div>
    </div>
  );
};

export default Login;
