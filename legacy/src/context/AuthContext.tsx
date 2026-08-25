import React, { createContext, useContext, useState } from 'react';
import type { MemberStatus, User } from '../types';
import * as authApi from '../api/auth';

interface AuthContextValue {
  user: User | null;
  status: MemberStatus;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  submitSignup: (payload: {
    nom: string;
    prenom: string;
    pseudo: string;
    email: string;
    password: string;
    audioFile: string;
  }) => Promise<void>;
  paySuccess: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const loggedIn = await authApi.login(email, password);
    setUser(loggedIn);
  };

  const logout = () => setUser(null);

  const submitSignup: AuthContextValue['submitSignup'] = async (payload) => {
    const created = await authApi.submitSignup(payload);
    setUser(created);
  };

  const paySuccess = async () => {
    if (!user) return;
    const { status } = await authApi.payAccessFee(user.id);
    setUser({ ...user, status });
  };

  const completeOnboarding = async () => {
    if (!user) return;
    const { status } = await authApi.completeOnboarding(user.id);
    setUser({ ...user, status });
  };

  const value: AuthContextValue = {
    user,
    status: user?.status ?? 'guest',
    isAdmin: user?.isAdmin ?? false,
    login,
    logout,
    submitSignup,
    paySuccess,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
