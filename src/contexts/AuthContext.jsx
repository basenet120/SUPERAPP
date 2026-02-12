import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthUser, useLogin, useLogout } from '../hooks/useQueries';
import { queryClient } from '../services/api';

const AuthContext = createContext(null);

// Demo user for testing without backend
const DEMO_USER = {
  id: 'demo-1',
  email: 'admin@basecreative.com',
  firstName: 'Admin',
  lastName: 'User',
  roles: ['admin'],
  permissions: ['*']
};

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  
  const { data: user, error, isLoading: userLoading } = useAuthUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  useEffect(() => {
    // Check if we have tokens
    const token = localStorage.getItem('accessToken');
    const isDemo = localStorage.getItem('demoMode') === 'true';
    
    if (isDemo) {
      setDemoMode(true);
      setIsAuthenticated(true);
      setIsLoading(false);
    } else if (!token) {
      setIsLoading(false);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && !demoMode) {
      setIsLoading(false);
      setIsAuthenticated(!!user);
    }
  }, [user, userLoading, demoMode]);

  useEffect(() => {
    if (error && !demoMode) {
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }, [error, demoMode]);

  const login = async (email, password) => {
    // Demo login for testing
    if (email === 'admin@basecreative.com' && password === 'password') {
      localStorage.setItem('demoMode', 'true');
      setDemoMode(true);
      setIsAuthenticated(true);
      return { success: true };
    }
    
    try {
      await loginMutation.mutateAsync({ email, password });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message };
    }
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      // Still clear local state even if API call fails
    }
    // Always clear local state
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('demoMode');
    queryClient.clear();
    setIsAuthenticated(false);
    setDemoMode(false);
  };

  const hasRole = useCallback((role) => {
    if (demoMode) return DEMO_USER.roles.includes(role);
    return user?.roles?.includes(role) || false;
  }, [user, demoMode]);

  const hasPermission = useCallback((permission) => {
    if (demoMode) return true;
    if (user?.roles?.includes('admin')) return true;
    return user?.permissions?.includes(permission) || false;
  }, [user, demoMode]);

  const currentUser = demoMode ? DEMO_USER : user;

  const value = {
    user: currentUser,
    isAuthenticated,
    isLoading: demoMode ? false : (isLoading || userLoading),
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
