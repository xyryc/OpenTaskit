import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { useAppSelector } from '@/store';
import type {
  Language,
  ToastMessage,
  UserMode,
} from '../types';
import { translate } from '../utils/i18n';

type LocationPermission = 'unknown' | 'granted' | 'denied';

/**
 * What a guest was trying to do when we asked them to create an account.
 * Guests may browse and view every posted job; these two actions are the
 * conversion triggers.
 */
export type AccountGateIntent = 'offer' | 'post';

interface AppState {
  language: Language;
  setLanguage: (l: Language) => void;
  t: (key: string, fallback?: string) => string;
  mode: UserMode;
  setMode: (m: UserMode) => void;
  /** Set while the account prompt is on screen, describing what the guest tried to do. */
  gateIntent: AccountGateIntent | null;
  /**
   * Returns true when the member may go ahead. For a guest it opens the
   * create-account prompt and returns false, so callers can simply bail out.
   */
  requireAccount: (intent: AccountGateIntent) => boolean;
  closeGate: () => void;
  available: boolean;
  toggleAvailable: () => void;
  locationPermission: LocationPermission;
  setLocationPermission: (p: LocationPermission) => void;
  currentLocation: string;
  setCurrentLocation: (loc: string) => void;
  userCoords: { lat: number; lng: number };
  setUserCoords: (coords: { lat: number; lng: number }) => void;
  searchHistory: string[];
  addSearch: (term: string) => void;
  toasts: ToastMessage[];
  toast: (t: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

let counter = 100;
const nextId = (prefix: string) => `${prefix}${++counter}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [mode, setMode] = useState<UserMode>('requester');
  const { authed, guest } = useAppSelector((state) => state.auth);
  const [gateIntent, setGateIntent] = useState<AccountGateIntent | null>(null);

  // The prompt is UI state; its access decision comes from Redux.
  useEffect(() => setGateIntent(null), [authed, guest]);

  const [available, setAvailable] = useState(true);
  const [locationPermission, setLocationPermission] = useState<LocationPermission>('unknown');
  const [currentLocation, setCurrentLocation] = useState('Kirulapone, Colombo 05');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: 6.9271,
    lng: 79.8612,
  });

  // Sync with the real OS permission on launch, rather than assuming granted.
  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then(async ({ status }) => {
        if (status === 'granted') {
          setLocationPermission('granted');
          try {
            const pos = await Location.getLastKnownPositionAsync();
            if (pos?.coords) {
              setUserCoords({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
              });
            }
          } catch {}
        } else {
          setLocationPermission('denied');
        }
      })
      .catch(() => setLocationPermission('denied'));
  }, []);

  const [searchHistory, setSearchHistory] = useState<string[]>([
    'deep cleaning',
    'plumber near me',
    'furniture assembly',
  ]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = useCallback((key: string, fallback?: string) => translate(language, key, fallback), [language]);

  const toast = useCallback((input: Omit<ToastMessage, 'id'>) => {
    const id = nextId('toast');
    setToasts((prev) => [...prev, { ...input, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const addSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setSearchHistory((prev) => [clean, ...prev.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 8));
  }, []);

  const toggleAvailable = useCallback(() => {
    setAvailable((v) => !v);
  }, []);

  const value: AppState = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      mode,
      setMode,
      gateIntent,
      requireAccount: (intent: AccountGateIntent) => {
        if (guest) {
          setGateIntent(intent);
          return false;
        }
        return true;
      },
      closeGate: () => setGateIntent(null),
      available,
      toggleAvailable,
      locationPermission,
      setLocationPermission,
      currentLocation,
      setCurrentLocation,
      userCoords,
      setUserCoords,
      searchHistory,
      addSearch,
      toasts,
      toast,
      dismissToast,
    }),
    [
      language,
      t,
      mode,
      gateIntent,
      guest,
      available,
      toggleAvailable,
      locationPermission,
      currentLocation,
      userCoords,
      searchHistory,
      addSearch,
      toasts,
      toast,
      dismissToast,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
