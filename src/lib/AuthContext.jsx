// src/lib/AuthContext.jsx
//
// Drop-in replacement for the Base44 AuthContext. Exposes the same shape
// ({ user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError,
// logout, navigateToLogin, checkUserAuth, checkAppState }) so App.jsx and
// every page that calls useAuth() needs zero changes.
//
// Adds: isGuest — true when the current session is an anonymous
// (supabase.auth.signInAnonymously()) session. Supabase sets `is_anonymous:
// true` directly on the auth user object for these sessions, so this is
// just read off the session, not something we compute ourselves.
//
// Note: Base44's "user_not_registered" concept (multi-tenant app gating)
// has no direct Supabase equivalent — this version only distinguishes
// "authenticated" vs "auth_required". If you need an invite-only/approved-
// users gate, add a `profiles` table with an `approved` column and check
// it in checkUserAuth below.

import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Supabase stores custom onboarding fields in user_metadata; flatten them
// onto the user object so user?.learning_level etc. keep working everywhere
// the app already expects that shape (Layout.jsx, Home.jsx, etc.)
const flattenUser = (supabaseUser) => {
  if (!supabaseUser) return null;
  return { ...supabaseUser, ...supabaseUser.user_metadata };
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false); // no Base44-style app gating by default
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState(null); // kept for API compatibility; unused here

  useEffect(() => {
    checkAppState();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(flattenUser(session.user));
        setIsAuthenticated(true);
        setIsGuest(session.user.is_anonymous === true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsGuest(false);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // Kept for API compatibility with the old flow (public-settings check).
  // Supabase has no per-app public settings concept, so this just delegates
  // straight to the user auth check.
  const checkAppState = async () => {
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (session?.user) {
        setUser(flattenUser(session.user));
        setIsAuthenticated(true);
        setIsGuest(session.user.is_anonymous === true);
        setAuthError(null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsGuest(false);
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      }
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsAuthenticated(false);
      setIsGuest(false);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    setIsGuest(false);
    if (shouldRedirect) {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isGuest,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
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
