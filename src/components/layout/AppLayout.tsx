import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuthStore } from '@/store/auth-store';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { agency, session, loadUserData } = useAuthStore();

  useEffect(() => {
    if (session && !agency) {
      loadUserData();
    }
  }, [session, agency]);

  return (
    <div className="min-h-screen bg-surface-950">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <TopBar onMobileMenuToggle={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
