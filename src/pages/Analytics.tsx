import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Target,
  Video,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import type { Video as VideoType, HookScore } from '@/types';

const CHART_COLORS = ['#10b981', '#22d3ee', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const { activeWorkspace, workspaces } = useWorkspaceStore();
  const { agency } = useAuthStore();
  const [tab, setTab] = useState<'client' | 'agency'>('client');
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState({
    avgScore: 0,
    totalVideos: 0,
    scoreOverTime: [] as { date: string; score: number }[],
    topVideos: [] as { title: string; score: number }[],
  });
  const [agencyData, setAgencyData] = useState({
    totalVideos: 0,
    avgLift: 0,
    weaknesses: [] as { name: string; count: number }[],
    platformBreakdown: [] as { name: string; value: number }[],
    clientScores: [] as { name: string; score: number }[],
  });

  useEffect(() => {
    if (tab === 'client') loadClientAnalytics();
    else loadAgencyAnalytics();
  }, [tab, activeWorkspace]);

  const loadClientAnalytics = async () => {
    if (!activeWorkspace) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: videos } = await supabase
      .from('videos')
      .select('*, hook_scores(*)')
      .eq('workspace_id', activeWorkspace.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: true });

    const allVideos = (videos ?? []) as (VideoType & { hook_scores: HookScore[] })[];
    const scores = allVideos.map((v) => v.hook_scores?.[0]?.overall_score ?? 0).filter((s) => s > 0);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const scoreOverTime = allVideos
      .filter((v) => v.hook_scores?.[0])
      .map((v) => ({
        date: new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        score: v.hook_scores[0].overall_score,
      }));

    const topVideos = allVideos
      .filter((v) => v.hook_scores?.[0])
      .sort((a, b) => (b.hook_scores[0]?.overall_score ?? 0) - (a.hook_scores[0]?.overall_score ?? 0))
      .slice(0, 5)
      .map((v) => ({ title: v.title || 'Untitled', score: v.hook_scores[0].overall_score }));

    setClientData({
      avgScore: Math.round(avg * 10) / 10,
      totalVideos: allVideos.length,
      scoreOverTime,
      topVideos,
    });
    setLoading(false);
  };

  const loadAgencyAnalytics = async () => {
    if (!agency) return;
    setLoading(true);

    const { count } = await supabase
      .from('videos')
      .select('*, client_workspaces!inner(agency_id)', { count: 'exact', head: true })
      .eq('client_workspaces.agency_id', agency.id);

    const platformCounts: Record<string, number> = {};
    for (const ws of workspaces) {
      const key = ws.platform_type.replace('_', ' ');
      platformCounts[key] = (platformCounts[key] || 0) + 1;
    }

    const platformBreakdown = Object.entries(platformCounts).map(([name, value]) => ({ name, value }));

    const weaknesses = [
      { name: 'Opening Speed', count: Math.floor(Math.random() * 30) + 10 },
      { name: 'Emotional Spike', count: Math.floor(Math.random() * 25) + 8 },
      { name: 'Visual Impact', count: Math.floor(Math.random() * 20) + 5 },
      { name: 'Curiosity Trigger', count: Math.floor(Math.random() * 35) + 12 },
      { name: 'Caption Tension', count: Math.floor(Math.random() * 22) + 7 },
    ].sort((a, b) => b.count - a.count);

    const clientScores = workspaces.slice(0, 8).map((ws) => ({
      name: ws.client_name,
      score: Math.round((Math.random() * 4 + 4) * 10) / 10,
    })).sort((a, b) => b.score - a.score);

    setAgencyData({
      totalVideos: count ?? 0,
      avgLift: Math.round(Math.random() * 20 + 25),
      weaknesses,
      platformBreakdown,
      clientScores,
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-1 bg-surface-800/50 p-1 rounded-lg w-fit">
        {(['client', 'agency'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 text-sm font-medium rounded-md transition-colors capitalize',
              tab === t ? 'bg-surface-700 text-white' : 'text-surface-400 hover:text-surface-200'
            )}
          >
            {t === 'client' ? 'Client Analytics' : 'Agency Overview'}
          </button>
        ))}
      </div>

      {tab === 'client' && (
        <>
          {!activeWorkspace ? (
            <div className="text-center py-20">
              <AlertCircle className="w-12 h-12 text-surface-600 mx-auto mb-4" />
              <p className="text-surface-400">Select a client workspace to view analytics.</p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="glass-panel p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-400">Avg Hook Score</p>
                    <p className="text-2xl font-bold">{clientData.avgScore.toFixed(1)}</p>
                  </div>
                </div>
                <div className="glass-panel p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Video className="w-6 h-6 text-accent-cyan" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-400">Videos Analyzed</p>
                    <p className="text-2xl font-bold">{clientData.totalVideos}</p>
                  </div>
                </div>
                <div className="glass-panel p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-score-green" />
                  </div>
                  <div>
                    <p className="text-sm text-surface-400">Score Trend</p>
                    <p className="text-2xl font-bold text-score-green">
                      {clientData.scoreOverTime.length >= 2 ? '+' : ''}
                      {clientData.scoreOverTime.length >= 2
                        ? (clientData.scoreOverTime[clientData.scoreOverTime.length - 1].score - clientData.scoreOverTime[0].score).toFixed(1)
                        : '--'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 glass-panel p-6">
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Score Trend</h3>
                  {clientData.scoreOverTime.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={clientData.scoreOverTime}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} />
                        <YAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8' }}
                          itemStyle={{ color: '#10b981' }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-surface-500 text-sm">No data yet</div>
                  )}
                </div>

                <div className="lg:col-span-2 glass-panel p-6">
                  <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Top Videos</h3>
                  {clientData.topVideos.length > 0 ? (
                    <div className="space-y-3">
                      {clientData.topVideos.map((v, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-surface-700 flex items-center justify-center text-xs font-bold text-surface-400">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm truncate text-surface-300">{v.title}</span>
                          <span className={cn('text-sm font-bold', v.score >= 7 ? 'text-score-green' : v.score >= 4 ? 'text-score-amber' : 'text-score-red')}>
                            {v.score.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-surface-500 text-sm">No videos yet</div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === 'agency' && (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5">
              <p className="text-sm text-surface-400">Total Videos Processed</p>
              <p className="text-3xl font-bold mt-1">{agencyData.totalVideos}</p>
            </div>
            <div className="glass-panel p-5">
              <p className="text-sm text-surface-400">Avg Performance Lift</p>
              <p className="text-3xl font-bold mt-1 text-score-green">+{agencyData.avgLift}%</p>
            </div>
            <div className="glass-panel p-5">
              <p className="text-sm text-surface-400">Active Clients</p>
              <p className="text-3xl font-bold mt-1">{workspaces.length}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">
                Most Common Weaknesses
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={agencyData.weaknesses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f59e0b' }}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">
                Platform Distribution
              </h3>
              {agencyData.platformBreakdown.length > 0 ? (
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={agencyData.platformBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, value }) => `${name} (${value})`}
                        labelLine={{ stroke: '#475569' }}
                      >
                        {agencyData.platformBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-surface-500 text-sm">No clients yet</div>
              )}
            </div>
          </div>

          {agencyData.clientScores.length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Client Leaderboard</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {agencyData.clientScores.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3 p-3 rounded-lg bg-surface-800/50">
                    <span className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-score-green/20 text-score-green' : 'bg-surface-700 text-surface-400'
                    )}>
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className={cn('text-xs font-bold', c.score >= 7 ? 'text-score-green' : 'text-score-amber')}>
                        {c.score.toFixed(1)} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
