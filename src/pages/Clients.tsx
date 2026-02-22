import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Video,
  X,
  Search,
  Archive,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { PLATFORMS, PLAN_LIMITS } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import type { PlatformType } from '@/lib/constants';

interface WorkspaceStats {
  id: string;
  videoCount: number;
  avgScore: number;
}

export default function Clients() {
  const navigate = useNavigate();
  const { workspaces, setActiveWorkspace, createWorkspace } = useWorkspaceStore();
  const { agency } = useAuthStore();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlatform, setNewPlatform] = useState<PlatformType>('tiktok');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [statsMap, setStatsMap] = useState<Record<string, WorkspaceStats>>({});

  useEffect(() => {
    loadStats();
  }, [workspaces]);

  const loadStats = async () => {
    const map: Record<string, WorkspaceStats> = {};
    for (const ws of workspaces) {
      const { count } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', ws.id);

      const { data: scores } = await supabase
        .from('hook_scores')
        .select('overall_score, videos!inner(workspace_id)')
        .eq('videos.workspace_id', ws.id);

      const allScores = (scores ?? []).map((s: Record<string, unknown>) => Number(s.overall_score)).filter((n: number) => n > 0);
      const avg = allScores.length > 0 ? allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length : 0;

      map[ws.id] = { id: ws.id, videoCount: count ?? 0, avgScore: Math.round(avg * 10) / 10 };
    }
    setStatsMap(map);
  };

  const handleCreate = async () => {
    setCreateError('');

    if (!agency) {
      await useAuthStore.getState().loadUserData();
      const refreshed = useAuthStore.getState().agency;
      if (!refreshed) {
        setCreateError('Unable to load agency data. Please refresh the page and try again.');
        return;
      }
    }

    const currentAgency = useAuthStore.getState().agency;
    if (!currentAgency || !newName.trim()) return;

    const limit = PLAN_LIMITS[currentAgency.plan_tier]?.workspaces ?? 5;
    if (workspaces.length >= limit) return;

    setCreating(true);
    const ws = await createWorkspace(currentAgency.id, newName.trim(), newPlatform);
    setCreating(false);
    if (ws) {
      setShowModal(false);
      setNewName('');
      setCreateError('');
      navigate('/dashboard');
    } else {
      setCreateError('Failed to create workspace. Please try again.');
    }
  };

  const limit = PLAN_LIMITS[agency?.plan_tier ?? 'starter']?.workspaces ?? 5;
  const atLimit = workspaces.length >= limit;

  const filtered = workspaces.filter((ws) =>
    ws.client_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-sm text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-surface-500">
            {workspaces.length}/{limit === Infinity ? 'Unlimited' : limit} clients
          </span>
          <button
            onClick={() => setShowModal(true)}
            disabled={atLimit}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {atLimit && (
        <div className="glass-panel p-4 border-score-amber/30">
          <p className="text-sm text-score-amber">
            You've reached the workspace limit for your plan.{' '}
            <button onClick={() => navigate('/billing')} className="underline font-medium">
              Upgrade to add more clients
            </button>
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Archive className="w-12 h-12 text-surface-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {search ? 'No clients match your search' : 'No clients yet'}
          </h3>
          <p className="text-surface-400 text-sm mb-6">
            {search ? 'Try a different search term.' : 'Create your first client workspace to get started.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((ws) => {
            const stat = statsMap[ws.id];
            const platform = PLATFORMS[ws.platform_type];
            return (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws);
                  navigate('/dashboard');
                }}
                className="glass-panel p-5 text-left hover:border-surface-600/80 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                      {ws.client_name}
                    </h3>
                    <p className="text-xs text-surface-400 mt-0.5">{platform?.label}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-surface-700/50 flex items-center justify-center">
                    <Video className="w-5 h-5 text-surface-400" />
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-surface-500 text-xs">Videos</p>
                    <p className="font-semibold">{stat?.videoCount ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-surface-500 text-xs">Avg Score</p>
                    <p className={cn('font-semibold', stat?.avgScore && stat.avgScore >= 6 ? 'text-score-green' : stat?.avgScore && stat.avgScore >= 3 ? 'text-score-amber' : 'text-surface-300')}>
                      {stat?.avgScore ? stat.avgScore.toFixed(1) : '--'}
                    </p>
                  </div>
                  <div>
                    <p className="text-surface-500 text-xs">Created</p>
                    <p className="text-surface-300">{formatDate(ws.created_at)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)} />
          <div className="relative glass-panel p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">New Client Workspace</h3>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Client Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  placeholder="e.g. Acme Corp"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Platform</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(PLATFORMS) as [PlatformType, { label: string }][]).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setNewPlatform(key)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors',
                        newPlatform === key
                          ? 'bg-brand-500/10 border-brand-500/50 text-brand-400'
                          : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-600'
                      )}
                    >
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {createError}
              </div>
            )}

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setCreateError(''); }}
                className="flex-1 py-2.5 border border-surface-700 text-surface-300 rounded-lg text-sm font-medium hover:bg-surface-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
