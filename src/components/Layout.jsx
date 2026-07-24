import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import Sidebar from '@/components/Sidebar';

export default function Layout() {
  const { user, isLoadingAuth, checkUserAuth } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background grid-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading OmniScribe...</p>
        </div>
      </div>
    );
  }

  if (!user?.learning_level) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} user={user} />
      <main className="flex-1 overflow-auto">
        <Outlet context={{ user, refreshUser: checkUserAuth }} />
      </main>
    </div>
  );
}