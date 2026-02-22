import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Video,
  Target,
  Upload,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import ScoreRing from '@/components/ui/ScoreRing';
import { cn, formatDate } from '@/lib/utils';
import type { Video as VideoType, HookScore } from '@/types';

interface RecentVideo extends VideoType {
  hook_scores: HookScore[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const { agency } = useAuthStore();
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);
  const [stats, setStats] = useState({ totalVideos: 0, avgScore: 0, avgLift: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }
    loadDashboardData();
  }, [activeWorkspace]);

  const loadDashboardData = async () => {
    if (!activeWorkspace) return;
    setLoading(true);

    const { data: videos } = await supabase
      .from('videos')
      .select('*, hook_scores(*)')
      .eq('workspace_id', activeWorkspace.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const allVideos = (videos ?? []) as RecentVideo[];
    setRecentVideos(allVideos);

    const { count } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', activeWorkspace.id);

    const scores = allVideos
      .flatMap((v) => v.hook_scores)
      .map((s) => s?.overall_score ?? 0)
      .filter((s) => s > 0);

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    setStats({
      totalVideos: count ?? 0,
      avgScore: Math.round(avgScore * 10) / 10,
      avgLift: scores.length > 0 ? Math.round(avgScore * 4.2) : 0,
    });

    setLoading(false);
  };

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-800 flex items-center justify-center mb-4">
          <Video className="w-8 h-8 text-surface-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Client Selected</h3>
        <p className="text-surface-400 text-sm mb-6 max-w-sm">
          Create a client workspace to start uploading and analyzing videos.
        </p>
        <button
          onClick={() => navigate('/clients')}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Add Your First Client
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Videos',
            value: stats.totalVideos.toString(),
            icon: Video,
            color: 'text-brand-400',
            bg: 'bg-brand-500/10',
          },
          {
            label: 'Avg Hook Score',
            value: stats.avgScore.toFixed(1),
            icon: Target,
            color: 'text-accent-cyan',
            bg: 'bg-cyan-500/10',
          },
          {
            label: 'Avg Performance Lift',
            value: `+${stats.avgLift}%`,
            icon: TrendingUp,
            color: 'text-score-green',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Plan',
            value: agency?.plan_tier ? agency.plan_tier.charAt(0).toUpperCase() + agency.plan_tier.slice(1) : 'Starter',
            icon: ArrowUpRight,
            color: 'text-score-amber',
            bg: 'bg-amber-500/10',
          },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-surface-400">{stat.label}</span>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('w-[18px] h-[18px]', stat.color)} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Recent Videos</h3>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New</span>
            </button>
          </div>

          {recentVideos.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-10 h-10 text-surface-600 mx-auto mb-3" />
              <p className="text-surface-400 text-sm mb-4">No videos yet for this client</p>
              <button
                onClick={() => navigate('/upload')}
                className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Upload First Video
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentVideos.map((video) => {
                const score = video.hook_scores?.[0];
                return (
                  <button
                    key={video.id}
                    onClick={() => navigate(`/video/${video.id}`)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-surface-700/30 transition-colors text-left"
                  >
                    <div className="w-16 h-10 rounded bg-surface-700 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5 text-surface-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-200 truncate">
                        {video.title || 'Untitled Video'}
                      </p>
                      <p className="text-xs text-surface-500">
                        {formatDate(video.created_at)} &middot; {video.status === 'complete' ? 'Analyzed' : video.status}
                      </p>
                    </div>
                    {score && (
                      <ScoreRing score={score.overall_score} size="sm" showLabel={false} animated={false} />
                    )}
                    <ChevronRight className="w-4 h-4 text-surface-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel p-6 flex flex-col items-center justify-center">
          <p className="text-sm text-surface-400 mb-4">Client Average Score</p>
          <ScoreRing score={stats.avgScore} size="lg" />
          <div className="mt-6 w-full space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-400">Videos Analyzed</span>
              <span className="font-medium">{stats.totalVideos}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-surface-400">Avg Lift</span>
              <span className="font-medium text-score-green">+{stats.avgLift}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
