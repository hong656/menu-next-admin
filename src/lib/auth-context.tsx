'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

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

// Decode a JWT and return payload (handles base64url)
function decodeJwtPayload<T = unknown>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef<number | null>(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearLogoutTimer();
    localStorage.removeItem('authToken');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  }, [clearLogoutTimer]);

  const scheduleAutoLogout = useCallback((token: string) => {
    const payload = decodeJwtPayload<{ exp?: number }>(token);
    if (!payload || !payload.exp) return;
    const expirationMs = payload.exp * 1000;
    const logoutAtMs = expirationMs + 60_000;
    const delayMs = logoutAtMs - Date.now();

    clearLogoutTimer();

    if (delayMs <= 0) {
      logout();
      return;
    }

    logoutTimerRef.current = window.setTimeout(() => {
      logout();
    }, delayMs);
  }, [clearLogoutTimer, logout]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      const payload = decodeJwtPayload<{ sub?: string; username?: string; email?: string }>(token);
      const usernameFromToken = payload?.username || payload?.sub || 'user';
      const emailFromToken = payload?.email || '';
      setUser((prev) => prev ?? { username: String(usernameFromToken), email: String(emailFromToken) });
      scheduleAutoLogout(token);
    }
    setLoading(false);

    return () => clearLogoutTimer();
  }, [scheduleAutoLogout, clearLogoutTimer]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signin`, {
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
          role: 'user'
        });
        scheduleAutoLogout(response.data.token);
        toast.success('Login Successful');
        return true;
      }
      toast.error('Login Failed', {
        description: 'Invalid username or password.',
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login Failed', {
        description: 'Invalid username or password.',
      });
      return false;
    } finally {
      setLoading(false);
    }
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
