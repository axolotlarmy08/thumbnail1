import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Upload,
  BarChart3,
  CreditCard,
  Settings,
  LogOut,
  Zap,
  ChevronDown,
  Plus,
  Video,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { cn } from '@/lib/utils';
import { PLATFORMS } from '@/lib/constants';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { profile, agency, signOut } = useAuthStore();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();
  const [wsOpen, setWsOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clients' },
    { to: '/upload', icon: Upload, label: 'Upload Video' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/billing', icon: CreditCard, label: 'Billing' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const content = (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-700/50">
      <div className="p-5 border-b border-surface-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-accent-cyan flex items-center justify-center">
            <Zap className="w-5 h-5 text-surface-950" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-white truncate">Video Hook Builder</h1>
            <p className="text-xs text-surface-400 truncate">{agency?.name ?? 'Agency'}</p>
          </div>
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1 text-surface-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-3 py-3 border-b border-surface-700/50">
        <div className="relative">
          <button
            onClick={() => setWsOpen(!wsOpen)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-800/80 hover:bg-surface-700/80 transition-colors"
          >
            <Video className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-sm font-medium text-surface-200 truncate flex-1 text-left">
              {activeWorkspace?.client_name ?? 'Select Client'}
            </span>
            <ChevronDown className={cn('w-4 h-4 text-surface-400 transition-transform shrink-0', wsOpen && 'rotate-180')} />
          </button>

          {wsOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws);
                    setWsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-700/50 transition-colors',
                    activeWorkspace?.id === ws.id && 'bg-surface-700/50 text-brand-400'
                  )}
                >
                  <span className="truncate flex-1 text-left">{ws.client_name}</span>
                  <span className="text-xs text-surface-500">{PLATFORMS[ws.platform_type]?.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setWsOpen(false);
                  navigate('/clients');
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-brand-400 hover:bg-surface-700/50 border-t border-surface-700"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onMobileClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
              )
            }
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-surface-700/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-300">
            {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-200 truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-surface-500 capitalize">{agency?.plan_tier ?? 'starter'} plan</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 text-surface-400 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-40">
        {content}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="relative w-72 h-full">{content}</aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-surface-400 hover:text-white transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
