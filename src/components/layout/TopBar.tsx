import { useLocation, useNavigate } from 'react-router-dom';
import { Upload, Bell } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { MobileMenuButton } from './Sidebar';
import { PLATFORMS } from '@/lib/constants';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Client Workspaces',
  '/upload': 'Upload Video',
  '/analytics': 'Analytics',
  '/agency-analytics': 'Agency Analytics',
  '/billing': 'Billing & Plans',
  '/settings': 'Settings',
  '/team': 'Team Management',
};

interface TopBarProps {
  onMobileMenuToggle: () => void;
}

export default function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();

  const pageTitle = PAGE_TITLES[location.pathname] ?? '';

  return (
    <header className="h-16 border-b border-surface-700/50 bg-surface-900/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileMenuButton onClick={onMobileMenuToggle} />
        <div>
          <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
          {activeWorkspace && (
            <p className="text-xs text-surface-400">
              {activeWorkspace.client_name} &middot; {PLATFORMS[activeWorkspace.platform_type]?.label}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 text-surface-400 hover:text-surface-200 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-400" />
        </button>
        <button
          onClick={() => navigate('/upload')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
      </div>
    </header>
  );
}
