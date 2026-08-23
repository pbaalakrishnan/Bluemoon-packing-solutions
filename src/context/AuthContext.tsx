import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { dbService } from '../services/db';

interface AuthContextType {
  currentUser: User | null;
  login: (emailOrUser: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUserRole: (role: Role) => void;
  hasPermission: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'bluemoon_active_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    // Default to admin user for first time setup
    return dbService.getUsers()[0] || null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [currentUser]);

  const login = (emailOrUser: string, pass: string) => {
    const res = dbService.authenticate(emailOrUser, pass);
    if (res.user) {
      setCurrentUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Authentication failed' };
  };

  const logout = () => {
    if (currentUser) {
      dbService.logAudit(currentUser.email, 'User Logged Out', 'Authentication', currentUser.id);
    }
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const switchUserRole = (role: Role) => {
    const userWithRole = dbService.getUsers().find((u) => u.role === role);
    if (userWithRole) {
      setCurrentUser(userWithRole);
      dbService.logAudit(
        userWithRole.email,
        `Switched Role to ${role}`,
        'Authentication',
        userWithRole.id,
      );
    }
  };

  const hasPermission = (module: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;

    if (role === 'Admin' || role === 'Super Admin') return true;

    if (role === 'Viewer') {
      // Read-only access to Dashboard, Raw Materials, Production, Finished Goods, Sales, Reports, Ledger
      return [
        'dashboard',
        'raw-materials',
        'production',
        'finished-goods',
        'sales',
        'ledger',
        'reports',
      ].includes(module);
    }

    if (role === 'Inventory User' || role === 'Inventory Manager') {
      return [
        'dashboard',
        'purchases',
        'raw-materials',
        'finished-goods',
        'ledger',
        'adjustments',
        'reports',
        'masters',
      ].includes(module);
    }

    if (role === 'Production User' || role === 'Production Manager') {
      return [
        'dashboard',
        'raw-materials',
        'production',
        'finished-goods',
        'ledger',
        'adjustments',
        'reports',
      ].includes(module);
    }

    if (role === 'Sales User' || role === 'Sales Manager') {
      return [
        'dashboard',
        'finished-goods',
        'sales',
        'reports',
        'masters',
      ].includes(module);
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchUserRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
