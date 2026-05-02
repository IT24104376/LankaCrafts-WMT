import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  registerTourist,
  loginTourist,
  getProfile,
  registerArtist,
  loginArtist,
  getArtistProfile
} from '../services/api';
import { loginAdmin, getMe } from '../api/adminApi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Interfaces ---

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TouristProfile {
  id: string;
  fullName: string;
  callingName: string;
  email: string;
  country: string;
  interests: string[];
  preferredLanguages: string[];
  preferredRegions: string[];
  savedWorkshops: string[];
  savedCrafts: string[];
  initials: string;
  idNumber?: string;
  dateOfBirth?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
  };
  profilePicUrl?: string;
  reviews?: string[];
}

interface ArtistProfile {
  id: string;
  fullName: string;
  callingName: string;
  email: string;
  phone?: string;
  craftType: string;
  bio: string;
  address?: {
    number?: string;
    street?: string;
    village?: string;
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
  location?: {
    type: string;
    coordinates: number[];
    formattedAddress: string;
  };
  specialties: string[];
  availability: Record<string, { morning: boolean; afternoon: boolean; evening: boolean }>;
  rating: number;
  reviewCount: number;
  initials: string;
  profilePicUrl?: string;
}

interface AuthContextType {
  loading: boolean;
  token: string | null;
  tourist: TouristProfile | null;
  artist: ArtistProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, profileData: object) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  loginArtist: (email: string, password: string) => Promise<void>;
  registerArtist: (email: string, password: string, profileData: object) => Promise<void>;
  logoutArtist: () => Promise<void>;
  refreshArtist: () => Promise<void>;
  admin: AdminUser | null;
  adminToken: string | null;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => void;
  isAdminAuthenticated: boolean;
  isTouristAuthenticated: boolean;
  isArtistAuthenticated: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [tourist, setTourist] = useState<TouristProfile | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAfterAuth = async (receivedToken: string) => {
    // Store token first so axios interceptor can use it
    await AsyncStorage.setItem('auth_token', receivedToken);
    setToken(receivedToken);

    try {
      const res = await getProfile();
      setTourist(res.data.tourist);
      setArtist(null);
    } catch {
      try {
        const res = await getArtistProfile();
        const artistData = res.data?.artist || res.data?.data;
        if (artistData) {
          setArtist({ ...artistData, id: artistData._id });
        }
        setTourist(null);
      } catch {
        setTourist(null);
        setArtist(null);
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          await fetchProfileAfterAuth(storedToken);
        }

        const storedAdminToken = await AsyncStorage.getItem('admin_token');
        if (storedAdminToken) {
          setAdminToken(storedAdminToken);
          try {
            const res = await getMe();
            setAdmin(res.data.admin);
          } catch {
            await handleAdminLogout();
          }
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // --- Tourist Actions ---
  const handleLogin = async (email: string, password: string) => {
    const res = await loginTourist({ email, password });
    const { token: newToken } = res.data;
    await fetchProfileAfterAuth(newToken);
  };

  const handleRegister = async (email: string, password: string, profileData: object) => {
    const res = await registerTourist({ email, password, ...profileData });
    const { token: newToken } = res.data;
    await fetchProfileAfterAuth(newToken);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setTourist(null);
    setArtist(null);
  };

  const refreshUser = async () => {
    try {
      const res = await getProfile();
      setTourist(res.data.tourist);
    } catch (err) {
      console.error('Failed to refresh tourist profile:', err);
    }
  };

  // --- Artist Actions ---
  const handleLoginArtist = async (email: string, password: string) => {
    const res = await loginArtist({ email, password });
    const { token: newToken } = res.data;
    await fetchProfileAfterAuth(newToken);
  };

  const handleRegisterArtist = async (email: string, password: string, profileData: object) => {
    const res = await registerArtist({ email, password, ...profileData });
    const { token: newToken } = res.data;
    await fetchProfileAfterAuth(newToken);
  };

  const logoutArtist = async () => {
    await handleLogout();
  };

  const refreshArtist = async () => {
    try {
      const res = await getArtistProfile();
      const artistData = res.data?.artist || res.data?.data;
      if (artistData) {
        setArtist({ ...artistData, id: artistData._id });
      }
    } catch (err) {
      console.error('Failed to refresh artist profile:', err);
    }
  };

  // --- Admin Actions ---
  const handleAdminLogin = async (email: string, password: string) => {
    const res = await loginAdmin(email, password);
    const { token: newToken, admin: adminData } = res.data;
    await AsyncStorage.setItem('admin_token', newToken);
    setAdminToken(newToken);
    setAdmin(adminData);
  };

  const handleAdminLogout = async () => {
    await AsyncStorage.removeItem('admin_token');
    setAdminToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        token,
        tourist,
        artist,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshUser,
        loginArtist: handleLoginArtist,
        registerArtist: handleRegisterArtist,
        logoutArtist,
        refreshArtist,
        admin,
        adminToken,
        adminLogin: handleAdminLogin,
        adminLogout: handleAdminLogout,
        isAdminAuthenticated: !!adminToken && !!admin,
        isTouristAuthenticated: !!tourist,
        isArtistAuthenticated: !!artist,
        isAuthenticated: !!token || !!adminToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
