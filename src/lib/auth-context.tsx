'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; email: string; role?: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage or token)
    const token = localStorage.getItem('authToken');
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      // You could also validate the token here by making an API call
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8080/api/auth/signin', {
        username,
        password
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        setIsAuthenticated(true);
        setUser({
          username: response.data.username,
          email: response.data.email,
          role: 'user' // You can add role logic if needed
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
