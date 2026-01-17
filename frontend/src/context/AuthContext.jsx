import { createContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const accessToken = localStorage.getItem('access_token');

      if (storedUser && accessToken) {
        try {
          // Verify token is still valid by fetching user
          const response = await authAPI.getMe();
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (err) {
          // Token invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.register(userData);
      const { user: newUser, tokens } = response.data;

      // Store tokens and user
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(newUser));

      setUser(newUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details || 
                          'Registration failed';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: err.response?.data };
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(credentials);
      const { user: loggedInUser, tokens } = response.data;

      // Store tokens and user
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      setLoading(false);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Invalid credentials';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);

    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (err) {
      // Ignore logout errors, still clear local state
    }

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');

    setUser(null);
    setError(null);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
