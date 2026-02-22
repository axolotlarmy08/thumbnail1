import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Zap,
  Eye,
  HelpCircle,
  MessageSquare,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Image,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import ScoreRing from '@/components/ui/ScoreRing';
import ScoreBar from '@/components/ui/ScoreBar';
import { cn, formatDate } from '@/lib/utils';
import type { Video, HookScore, Caption, Thumbnail, OptimizationPrediction, Transcript, ThumbnailOption } from '@/types';

export default function VideoResults() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [video, setVideo] = useState<Video | null>(null);
  const [hookScore, setHookScore] = useState<HookScore | null>(null);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [thumbnail, setThumbnail] = useState<Thumbnail | null>(null);
  const [prediction, setPrediction] = useState<OptimizationPrediction | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionText, setCaptionText] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(0);
  const [savingFrame, setSavingFrame] = useState(false);
  const [activeTab, setActiveTab] = useState<'scores' | 'thumbnail' | 'caption' | 'transcript'>('scores');

  useEffect(() => {
    if (videoId) loadData();
  }, [videoId]);

  const loadData = async () => {
    if (!videoId) return;
    setLoading(true);

    const [
      { data: v },
      { data: hs },
      { data: c },
      { data: t },
      { data: p },
      { data: tr },
    ] = await Promise.all([
      supabase.from('videos').select('*').eq('id', videoId).maybeSingle(),
      supabase.from('hook_scores').select('*').eq('video_id', videoId).maybeSingle(),
      supabase.from('captions').select('*').eq('video_id', videoId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('thumbnails').select('*').eq('video_id', videoId).maybeSingle(),
      supabase.from('optimization_predictions').select('*').eq('video_id', videoId).maybeSingle(),
      supabase.from('transcripts').select('*').eq('video_id', videoId).maybeSingle(),
    ]);

    setVideo(v as Video | null);
    setHookScore(hs as HookScore | null);
    setCaption(c as Caption | null);
    setCaptionText((c as Caption | null)?.caption_text ?? '');
    setThumbnail(t as Thumbnail | null);
    setSelectedFrameIdx((t as Thumbnail | null)?.selected_index ?? 0);
    setPrediction(p as OptimizationPrediction | null);
    setTranscript(tr as Transcript | null);
    setLoading(false);
  };

  const handleCopyCaption = async () => {
    if (!captionText) return;
    const hashtagStr = caption?.hashtags?.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ') ?? '';
    await navigator.clipboard.writeText(`${captionText}\n\n${hashtagStr}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!video || !caption || !session) return;
    setRegenerating(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/regenerate-caption`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          video_id: video.id,
          platform_type: caption.platform_optimized_for,
        }),
      });

      if (!response.ok) throw new Error('Regeneration failed');

      const { caption: newCaption } = await response.json();
      if (newCaption) {
        setCaption(newCaption as Caption);
        setCaptionText(newCaption.caption_text);
      }
    } catch {
      // silently fail
    }
    setRegenerating(false);
  };

  const handleSaveCaption = async () => {
    if (!caption) return;
    await supabase.from('captions').update({ caption_text: captionText }).eq('id', caption.id);
    setCaption({ ...caption, caption_text: captionText });
    setEditingCaption(false);
  };

  const handleSelectFrame = async (option: ThumbnailOption, idx: number) => {
    if (!thumbnail) return;
    setSelectedFrameIdx(idx);
    setSavingFrame(true);

    await supabase
      .from('thumbnails')
      .update({
        selected_index: idx,
        selected_frame_url: option.url,
        frame_timestamp: option.timestamp,
      })
      .eq('id', thumbnail.id);

    setThumbnail({
      ...thumbnail,
      selected_index: idx,
      selected_frame_url: option.url,
      frame_timestamp: option.timestamp,
    });
    setSavingFrame(false);
  };

  const handleDownloadFrame = async (url: string, format: 'png' | 'jpg') => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `thumbnail.${format}`;
    a.click();
    URL.revokeObjectURL(blobUrl);
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
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-400 text-sm hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (video.status !== 'complete' && video.status !== 'failed') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 text-brand-400 animate-spin" />
        <p className="text-surface-300 font-medium">Video is still processing...</p>
        <p className="text-surface-500 text-sm">Status: {video.status.replace(/_/g, ' ')}</p>
        <button
          onClick={loadData}
          className="mt-2 px-4 py-2 text-sm text-brand-400 hover:text-brand-300 border border-surface-700 rounded-lg"
        >
          Refresh
        </button>
      </div>
    );
  }

  const severityIcon = (sev: string) => {
    if (sev === 'critical') return <AlertTriangle className="w-4 h-4 text-score-red shrink-0" />;
    if (sev === 'moderate') return <AlertCircle className="w-4 h-4 text-score-amber shrink-0" />;
    return <Info className="w-4 h-4 text-surface-400 shrink-0" />;
  };

  const thumbnailOptions: ThumbnailOption[] = thumbnail?.thumbnail_options ?? [];
  const selectedFrame = thumbnailOptions[selectedFrameIdx] ?? thumbnailOptions[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold truncate">{video.title || 'Untitled Video'}</h2>
          <p className="text-sm text-surface-400">{formatDate(video.created_at)}</p>
        </div>
        <button
          onClick={() => navigate(`/video/${videoId}/report`)}
          className="hidden sm:flex items-center gap-2 px-4 py-2 border border-surface-700 hover:border-surface-600 text-surface-300 hover:text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div>

      {prediction && (
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Optimization Impact</h3>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="text-center">
              <p className="text-xs text-surface-500 mb-2">Original Score</p>
              <ScoreRing score={prediction.original_hook_score} size="md" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="w-6 h-6 text-brand-400" />
              <span className="text-xs text-surface-400">Optimized</span>
            </div>
            <div className="text-center">
              <p className="text-xs text-surface-500 mb-2">Optimized Score</p>
              <ScoreRing score={prediction.optimized_hook_score} size="md" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4 sm:ml-8">
              <div className="glass-panel-sm p-4 text-center animate-pulse-glow">
                <p className="text-2xl font-bold text-score-green">+{prediction.predicted_ctr_lift}%</p>
                <p className="text-xs text-surface-400 mt-1">Predicted CTR Lift</p>
              </div>
              <div className="glass-panel-sm p-4 text-center">
                <p className="text-2xl font-bold text-accent-cyan">+{prediction.predicted_watch_time_lift}%</p>
                <p className="text-xs text-surface-400 mt-1">Watch Time Lift</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-1 bg-surface-800/50 p-1 rounded-lg w-fit">
        {(['scores', 'thumbnail', 'caption', 'transcript'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize',
              activeTab === tab
                ? 'bg-surface-700 text-white'
                : 'text-surface-400 hover:text-surface-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'scores' && hookScore && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="glass-panel p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">
              Hook Strength
            </h3>
            <ScoreRing score={hookScore.overall_score} size="lg" />
          </div>

          <div className="glass-panel p-6 space-y-5">
            <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Score Breakdown</h3>
            <ScoreBar label="Opening Speed" score={hookScore.opening_speed_score} icon={<Clock className="w-4 h-4" />} delay={0} />
            <ScoreBar label="Emotional Spike" score={hookScore.emotional_spike_score} icon={<Zap className="w-4 h-4" />} delay={150} />
            <ScoreBar label="Visual Impact" score={hookScore.visual_impact_score} icon={<Eye className="w-4 h-4" />} delay={300} />
            <ScoreBar label="Curiosity Trigger" score={hookScore.curiosity_trigger_score} icon={<HelpCircle className="w-4 h-4" />} delay={450} />
            <ScoreBar label="Caption Tension" score={hookScore.caption_tension_score} icon={<MessageSquare className="w-4 h-4" />} delay={600} />
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Recommendations</h3>
            <div className="space-y-3">
              {(hookScore.recommendations ?? []).map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-surface-800/50 animate-slide-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {severityIcon(rec.severity)}
                  <div>
                    <p className="text-xs font-medium text-surface-300 mb-0.5">{rec.category}</p>
                    <p className="text-sm text-surface-400">{rec.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'thumbnail' && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">
              Choose Your Thumbnail
            </h3>
            {savingFrame && (
              <span className="text-xs text-brand-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </span>
            )}
          </div>

          {thumbnailOptions.length > 0 ? (
            <>
              <div className="mb-6">
                <p className="text-xs text-surface-500 mb-3">Selected Frame</p>
                <div className="rounded-xl overflow-hidden bg-surface-800 aspect-video max-w-2xl mx-auto border-2 border-brand-500/30">
                  <img
                    src={selectedFrame?.url || ''}
                    alt="Selected thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-center justify-between mt-3 max-w-2xl mx-auto">
                  <div className="flex items-center gap-2 text-xs text-surface-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Frame at {selectedFrame?.timestamp?.toFixed(1)}s</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => selectedFrame && handleDownloadFrame(selectedFrame.url, 'png')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PNG</span>
                    </button>
                    <button
                      onClick={() => selectedFrame && handleDownloadFrame(selectedFrame.url, 'jpg')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-700 hover:bg-surface-600 text-sm font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JPG</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-surface-500 mb-3">Choose from extracted frames</p>
                <div className="grid grid-cols-3 gap-4">
                  {thumbnailOptions.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectFrame(option, idx)}
                      className={cn(
                        'relative rounded-xl overflow-hidden aspect-video border-2 transition-all group',
                        selectedFrameIdx === idx
                          ? 'border-brand-500 ring-2 ring-brand-500/30 scale-[1.02]'
                          : 'border-surface-700 hover:border-surface-500'
                      )}
                    >
                      <img
                        src={option.url}
                        alt={`Frame ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className={cn(
                        'absolute inset-0 flex items-center justify-center transition-opacity',
                        selectedFrameIdx === idx
                          ? 'bg-brand-500/10'
                          : 'bg-black/0 group-hover:bg-black/20'
                      )}>
                        {selectedFrameIdx === idx && (
                          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="flex items-center gap-1 text-xs text-white/80">
                          <Image className="w-3 h-3" />
                          <span>Frame {idx + 1} - {option.timestamp.toFixed(1)}s</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-surface-500">
              <Image className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No thumbnail frames available.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'caption' && caption && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Generated Caption</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-surface-700 text-surface-300 capitalize">
                {caption.tone}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-surface-700 text-surface-300 capitalize">
                {caption.platform_optimized_for?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {editingCaption ? (
            <div>
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
              />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleSaveCaption}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setCaptionText(caption.caption_text);
                    setEditingCaption(false);
                  }}
                  className="px-4 py-2 text-surface-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditingCaption(true)}
              className="p-4 bg-surface-800/50 rounded-lg cursor-text hover:bg-surface-800/80 transition-colors"
            >
              <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-wrap">{captionText}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {caption.hashtags?.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-brand-500/10 text-brand-400 text-xs font-medium rounded-full">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleCopyCaption}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
            </button>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 border border-surface-700 hover:border-surface-600 text-surface-300 hover:text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', regenerating && 'animate-spin')} />
              <span>{regenerating ? 'Generating...' : 'Regenerate'}</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'transcript' && (
        <div className="glass-panel p-6">
          <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Transcript</h3>
          {transcript ? (
            <div className="space-y-2">
              {transcript.segments?.map((seg, i) => (
                <div key={i} className="flex gap-3 p-2 rounded hover:bg-surface-800/50">
                  <span className="text-xs text-surface-500 font-mono mt-0.5 shrink-0 w-16">
                    {seg.start.toFixed(1)}s
                  </span>
                  <p className="text-sm text-surface-300">{seg.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-surface-400 text-sm">No transcript available.</p>
          )}
        </div>
      )}
    </div>
  );
}
