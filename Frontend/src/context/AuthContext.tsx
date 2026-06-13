import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'PATIENT' | 'LAB_TECH' | 'PHARMACIST';
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configure Axios interceptors for JWT injection
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
    };
  }, [token]);

  // Attempt silent refresh on boot
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await refreshAccessToken();
      } catch (err) {
        console.log('Silent token refresh failed on boot (normal if not logged in).');
      } finally {
        setIsLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = (accessToken: string, userPayload: User) => {
    setToken(accessToken);
    setUser(userPayload);
    localStorage.setItem('hms_user', JSON.stringify(userPayload));
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout request error:', err);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('hms_user');
    }
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const response = await axios.post('/api/auth/refresh');
      const { accessToken } = response.data;
      
      // If we have saved user details, restore them
      const savedUser = localStorage.getItem('hms_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setToken(accessToken);
      return accessToken;
    } catch (error) {
      // Clear session if refresh token is expired or invalid
      setToken(null);
      setUser(null);
      localStorage.removeItem('hms_user');
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      logout,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
