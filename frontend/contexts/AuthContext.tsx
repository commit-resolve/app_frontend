import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (email: string, phone: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        const userData = await authAPI.getMe();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      await AsyncStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    try {
      const response = await authAPI.login({ identifier, password });
      await AsyncStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (email: string, phone: string, name: string, password: string) => {
    try {
      const response = await authAPI.register({ email, phone, name, password });
      await AsyncStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      const userData = await authAPI.getMe();
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
