// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kullanıcı durumunu izle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Giriş yap
  const login = async (email, password) => {
    try {
      setError('');
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      let errorMessage = 'Giriş yapılamadı.';
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'Kullanıcı bulunamadı.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Hatalı şifre.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Geçersiz email adresi.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Bu kullanıcı devre dışı bırakılmış.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Kullanıcı adı veya şifre hatalı.';
          break;
        default:
          errorMessage = error.message || 'Bir hata oluştu.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      setError('Çıkış yapılamadı.');
      throw error;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    error,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
