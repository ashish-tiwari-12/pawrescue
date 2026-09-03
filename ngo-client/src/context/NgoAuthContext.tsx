import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, NGO } from "../types";
import { ngoAuthService, NGORegisterPayload, NGOAuthResponse } from "../services/ngoAuthService";

interface NgoAuthContextType {
  user: User | null;
  ngo: NGO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<NGOAuthResponse>;
  register: (payload: NGORegisterPayload) => Promise<NGOAuthResponse>;
  verifyEmail: (email: string, otp: string) => Promise<NGOAuthResponse>;
  forgotPassword: (email: string) => Promise<{ message: string; email: string }>;
  resetPassword: (data: { email: string; otp: string; newPassword: string }) => Promise<NGOAuthResponse>;
  demoLogin: () => Promise<NGOAuthResponse>;
  logout: () => void;
  updateNgoProfile: (settings: Partial<NGO>) => Promise<{ message: string; ngo: NGO }>;
  refreshProfile: () => Promise<void>;
  setNgo: (ngo: NGO | null) => void;
}

const NgoAuthContext = createContext<NgoAuthContextType | undefined>(undefined);

export const NgoAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [ngo, setNgo] = useState<NGO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const storedToken = ngoAuthService.getToken();
      const storedUser = ngoAuthService.getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        // Refresh full profile in background
        try {
          const profile = await ngoAuthService.getProfile();
          if (profile.user) setUser(profile.user);
          if (profile.ngo) setNgo(profile.ngo);
        } catch (e) {
          console.warn("Could not fetch remote profile on boot, using cache:", e);
        }
      }
    } catch (err) {
      console.error("Error initializing NGO Auth Context:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await ngoAuthService.login(credentials);
      if (res.token) setToken(res.token);
      if (res.user) setUser(res.user);
      if (res.ngo) setNgo(res.ngo);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: NGORegisterPayload) => {
    setIsLoading(true);
    try {
      const res = await ngoAuthService.register(payload);
      if (res.token) setToken(res.token);
      if (res.user) setUser(res.user);
      if (res.ngo) setNgo(res.ngo);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await ngoAuthService.verifyEmail(email, otp);
    if (res.token) setToken(res.token);
    if (res.user) setUser(res.user);
    return res;
  };

  const forgotPassword = async (email: string) => {
    return await ngoAuthService.forgotPassword(email);
  };

  const resetPassword = async (data: { email: string; otp: string; newPassword: string }) => {
    const res = await ngoAuthService.resetPassword(data);
    if (res.token) setToken(res.token);
    if (res.user) setUser(res.user);
    return res;
  };

  const demoLogin = async () => {
    setIsLoading(true);
    try {
      const res = await ngoAuthService.demoLogin();
      if (res.token) setToken(res.token);
      if (res.user) setUser(res.user);
      if (res.ngo) setNgo(res.ngo);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    ngoAuthService.logout();
    setUser(null);
    setNgo(null);
    setToken(null);
  };

  const updateNgoProfile = async (settings: Partial<NGO>) => {
    const res = await ngoAuthService.updateProfile(settings);
    if (res.ngo) setNgo(res.ngo);
    return res;
  };

  const refreshProfile = async () => {
    try {
      const profile = await ngoAuthService.getProfile();
      if (profile.user) setUser(profile.user);
      if (profile.ngo) setNgo(profile.ngo);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  return (
    <NgoAuthContext.Provider
      value={{
        user,
        ngo,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        verifyEmail,
        forgotPassword,
        resetPassword,
        demoLogin,
        logout,
        updateNgoProfile,
        refreshProfile,
        setNgo
      }}
    >
      {children}
    </NgoAuthContext.Provider>
  );
};

export const useNgoAuth = (): NgoAuthContextType => {
  const context = useContext(NgoAuthContext);
  if (!context) {
    throw new Error("useNgoAuth must be used within an NgoAuthProvider");
  }
  return context;
};
