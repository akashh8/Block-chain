import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { NodeRole } from '../types';

export interface User {
  email: string;
  role: NodeRole | 'regulator';
  name: string;
  avatarUrl?: string;
  organization?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, role: NodeRole | 'regulator') => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Preset mock profiles matching the seeded DB organizations
export const ROLE_PRESETS = [
  {
    role: 'regulator' as const,
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@gbrc.gov',
    organization: 'Global Drug Registry Authority (GDRA)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  },
  {
    role: 'manufacturer' as const,
    name: 'Dr. Michael Chen',
    email: 'm.chen@pharma-labs.com',
    organization: 'Apex BioLabs (Manufacturer)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    role: 'distributor' as const,
    name: 'Elena Rostova',
    email: 'e.rostova@supplychain.com',
    organization: 'LogiPharma Logistics (Distributor)',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    role: 'pharmacy' as const,
    name: 'James O\'Connor',
    email: 'j.oconnor@citypharma.com',
    organization: 'City Care Pharmacy & Clinics (Operator)',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and check localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('gbrc_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('gbrc_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, role: NodeRole | 'regulator'): Promise<boolean> => {
    setIsLoading(true);
    // Simulate a brief premium auth delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Find preset profile or create custom
    const preset = ROLE_PRESETS.find((p) => p.role === role);
    const loggedInUser: User = {
      email,
      role,
      name: preset ? preset.name : email.split('@')[0].replace('.', ' '),
      organization: preset ? preset.organization : 'Guest Partner Org',
      avatarUrl: preset?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
    };

    setUser(loggedInUser);
    localStorage.setItem('gbrc_user', JSON.stringify(loggedInUser));
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('gbrc_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
      }}
    >
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
