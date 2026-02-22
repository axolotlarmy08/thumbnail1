import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { getScoreLabel, formatDate, cn, getScoreColor } from '@/lib/utils';
import type { Video, HookScore, Caption, Thumbnail, OptimizationPrediction } from '@/types';

export default function VideoReport() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { agency } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();
  const reportRef = useRef<HTMLDivElement>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [hookScore, setHookScore] = useState<HookScore | null>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [prediction, setPrediction] = useState<OptimizationPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const isWhiteLabel = agency?.plan_tier === 'scale';

  useEffect(() => {
    if (videoId) loadData();
  }, [videoId]);

  const loadData = async () => {
    if (!videoId) return;
    const [{ data: v }, { data: hs }, { data: c }, { data: t }, { data: p }] = await Promise.all([
      supabase.from('videos').select('*').eq('id', videoId).maybeSingle(),
      supabase.from('hook_scores').select('*').eq('video_id', videoId).maybeSingle(),
      supabase.from('captions').select('*').eq('video_id', videoId).maybeSingle(),
      supabase.from('thumbnails').select('*').eq('video_id', videoId).maybeSingle(),
      supabase.from('optimization_predictions').select('*').eq('video_id', videoId).maybeSingle(),
    ]);

    setVideo(v as Video | null);
    setHookScore(hs as HookScore | null);
    setCaption(c as Caption | null);
    setThumbnail(t as Thumbnail | null);
    setPrediction(p as OptimizationPrediction | null);
    setLoading(false);
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${video?.title ?? 'video'}-report.pdf`);
    } catch {
      // PDF generation unavailable
    }
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400">Video not found.</p>
      </div>
    );
  }

  const scoreItems = hookScore
    ? [
        { label: 'Opening Speed', score: hookScore.opening_speed_score },
        { label: 'Emotional Spike', score: hookScore.emotional_spike_score },
        { label: 'Visual Impact', score: hookScore.visual_impact_score },
        { label: 'Curiosity Trigger', score: hookScore.curiosity_trigger_score },
        { label: 'Caption Tension', score: hookScore.caption_tension_score },
      ]
    : [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/video/${videoId}`)}
          className="flex items-center gap-2 text-surface-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{generating ? 'Generating PDF...' : 'Download PDF'}</span>
        </button>
      </div>

      <div ref={reportRef} className="glass-panel p-8 space-y-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between border-b border-surface-700 pb-6">
          <div>
            <h2 className="text-2xl font-bold">{video.title || 'Untitled Video'}</h2>
            <p className="text-sm text-surface-400 mt-1">
              {activeWorkspace?.client_name} &middot; {formatDate(video.created_at)}
            </p>
          </div>
          {!isWhiteLabel && (
            <div className="flex items-center gap-2 text-surface-400">
              <Zap className="w-5 h-5 text-brand-400" />
              <span className="text-sm font-medium">Video Hook Builder</span>
            </div>
          )}
          {isWhiteLabel && agency?.name && (
            <span className="text-sm font-medium text-surface-300">{agency.name}</span>
          )}
        </div>

        {hookScore && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Hook Strength Score</h3>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className={cn('text-5xl font-black', getScoreColor(hookScore.overall_score))}>
                  {hookScore.overall_score.toFixed(1)}
                </p>
                <p className="text-sm text-surface-400 mt-1">{getScoreLabel(hookScore.overall_score)}</p>
              </div>
              <div className="flex-1 space-y-3">
                {scoreItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-sm text-surface-400 w-32">{item.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-700">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          item.score >= 7 ? 'bg-score-green' : item.score >= 4 ? 'bg-score-amber' : 'bg-score-red'
                        )}
                        style={{ width: `${(item.score / 10) * 100}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-bold w-8 text-right', getScoreColor(item.score))}>
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {prediction && (
          <div className="border-t border-surface-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Predicted Engagement Impact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-surface-800/50 text-center">
                <p className="text-3xl font-bold text-score-green">+{prediction.predicted_ctr_lift}%</p>
                <p className="text-sm text-surface-400 mt-1">Predicted CTR Lift</p>
              </div>
              <div className="p-4 rounded-lg bg-surface-800/50 text-center">
                <p className="text-3xl font-bold text-accent-cyan">+{prediction.predicted_watch_time_lift}%</p>
                <p className="text-sm text-surface-400 mt-1">Watch Time Lift</p>
              </div>
            </div>
          </div>
        )}

        {thumbnail?.ai_suggested_frame_url && (
          <div className="border-t border-surface-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Selected Thumbnail</h3>
            <div className="rounded-xl overflow-hidden bg-surface-800 aspect-video max-w-md">
              <img
                src={thumbnail.ai_suggested_frame_url}
                alt="Thumbnail"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {caption && (
          <div className="border-t border-surface-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Optimized Caption</h3>
            <div className="p-4 rounded-lg bg-surface-800/50">
              <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">
                {caption.caption_text}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {caption.hashtags?.map((tag) => (
                  <span key={tag} className="text-xs text-brand-400">
                    {tag.startsWith('#') ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {hookScore?.recommendations && hookScore.recommendations.length > 0 && (
          <div className="border-t border-surface-700 pt-6">
            <h3 className="text-lg font-semibold mb-4">Optimization Suggestions</h3>
            <div className="space-y-2">
              {hookScore.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50">
                  <span className={cn(
                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                    rec.severity === 'critical' ? 'bg-score-red' : rec.severity === 'moderate' ? 'bg-score-amber' : 'bg-surface-500'
                  )} />
                  <div>
                    <p className="text-xs font-medium text-surface-400">{rec.category}</p>
                    <p className="text-sm text-surface-300">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
