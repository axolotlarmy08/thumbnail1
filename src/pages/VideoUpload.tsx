import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Film, X, Loader2, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { PROCESSING_STEPS } from '@/lib/constants';
import { formatFileSize, cn } from '@/lib/utils';
import { extractFrames, uploadFrames, getVideoDuration } from '@/lib/video-frames';

export default function VideoUpload() {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspaceStore();
  const { session } = useAuthStore();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [error, setError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const validateFile = (f: File): boolean => {
    const validTypes = ['video/mp4', 'video/quicktime'];
    if (!validTypes.includes(f.type)) {
      setError('Only MP4 and MOV files are supported.');
      return false;
    }
    if (f.size > 500 * 1024 * 1024) {
      setError('File size must be under 500MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f && validateFile(f)) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && validateFile(f)) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const stepIndex = (key: string) => PROCESSING_STEPS.findIndex((s) => s.key === key);

  const handleProcess = async () => {
    if (!file || !activeWorkspace || !session) return;
    setProcessing(true);
    setCurrentStep(0);
    setError('');

    try {
      const duration = await getVideoDuration(file);

      const { data: video, error: videoError } = await supabase
        .from('videos')
        .insert({
          workspace_id: activeWorkspace.id,
          title: title || file.name,
          file_size: file.size,
          duration_seconds: duration,
          status: 'uploading',
        })
        .select()
        .maybeSingle();

      if (videoError || !video) throw new Error('Failed to create video record.');

      const storagePath = `${activeWorkspace.id}/${video.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(storagePath, file, { contentType: file.type, upsert: true });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      await supabase
        .from('videos')
        .update({ file_url: storagePath })
        .eq('id', video.id);

      const frames = await extractFrames(file, 3);
      const uploadedFrames = await uploadFrames(frames, video.id);

      await supabase.from('thumbnails').insert({
        video_id: video.id,
        thumbnail_options: uploadedFrames,
        selected_index: 0,
        selected_frame_url: uploadedFrames[0]?.url ?? null,
        ai_suggested_frame_url: uploadedFrames[0]?.url ?? null,
        frame_timestamp: uploadedFrames[0]?.timestamp ?? 0,
      });

      setCurrentStep(1);

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-video`;
      const processResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          video_id: video.id,
          platform_type: activeWorkspace.platform_type,
        }),
      });

      if (!processResponse.ok) {
        const errBody = await processResponse.json().catch(() => ({}));
        throw new Error(errBody.error || 'Video processing failed.');
      }

      pollVideoStatus(video.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during processing.');
      setProcessing(false);
      setCurrentStep(-1);
    }
  };

  const pollVideoStatus = (videoId: string) => {
    pollingRef.current = setInterval(async () => {
      const { data } = await supabase
        .from('videos')
        .select('status')
        .eq('id', videoId)
        .maybeSingle();

      if (!data) return;

      const idx = stepIndex(data.status);
      if (idx >= 0) setCurrentStep(idx);

      if (data.status === 'complete') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        navigate(`/video/${videoId}`);
      }
      if (data.status === 'failed') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        const { data: failedVideo } = await supabase
          .from('videos')
          .select('error_message')
          .eq('id', videoId)
          .maybeSingle();
        setError(failedVideo?.error_message || 'Video processing failed. Please try again.');
        setProcessing(false);
      }
    }, 2000);
  };

  if (!activeWorkspace) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-surface-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Client Selected</h3>
        <p className="text-surface-400 text-sm mb-6">Select a client workspace before uploading.</p>
        <button
          onClick={() => navigate('/clients')}
          className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg"
        >
          Go to Clients
        </button>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="max-w-lg mx-auto py-12 animate-fade-in">
        <div className="glass-panel p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
          <h3 className="text-xl font-bold mb-2">Analyzing Video</h3>
          <p className="text-surface-400 text-sm mb-8">
            {title || 'Your video'} is being processed with AI...
          </p>

          <div className="space-y-4">
            {PROCESSING_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-500',
                    i < currentStep
                      ? 'bg-brand-500 text-white'
                      : i === currentStep
                      ? 'bg-brand-500/20 text-brand-400 ring-2 ring-brand-500/50 animate-pulse'
                      : 'bg-surface-700 text-surface-500'
                  )}
                >
                  {i < currentStep ? '\u2713' : i + 1}
                </div>
                <span
                  className={cn(
                    'text-sm transition-colors',
                    i < currentStep
                      ? 'text-surface-300'
                      : i === currentStep
                      ? 'text-white font-medium'
                      : 'text-surface-500'
                  )}
                >
                  {step.label}
                </span>
                {i === currentStep && (
                  <Loader2 className="w-4 h-4 text-brand-400 animate-spin ml-auto" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 h-1.5 rounded-full bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-cyan transition-all duration-1000"
              style={{ width: `${((currentStep + 1) / PROCESSING_STEPS.length) * 100}%` }}
            />
          </div>

          <p className="text-xs text-surface-500 mt-4">
            AI analysis may take 30-90 seconds depending on video length.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-1">Upload Video</h3>
        <p className="text-sm text-surface-400 mb-6">
          Upload a video for {activeWorkspace.client_name} to analyze and optimize the hook.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
            dragActive
              ? 'border-brand-400 bg-brand-500/5'
              : file
              ? 'border-brand-500/30 bg-brand-500/5'
              : 'border-surface-700 hover:border-surface-600 bg-surface-800/30'
          )}
        >
          <input
            type="file"
            accept="video/mp4,video/quicktime"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {file ? (
            <div className="space-y-3">
              <Film className="w-12 h-12 text-brand-400 mx-auto" />
              <div>
                <p className="font-medium text-white">{file.name}</p>
                <p className="text-sm text-surface-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setTitle('');
                }}
                className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-12 h-12 text-surface-500 mx-auto" />
              <div>
                <p className="font-medium text-surface-200">
                  Drop your video here or click to browse
                </p>
                <p className="text-sm text-surface-500 mt-1">MP4 or MOV, max 500MB</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {file && (
        <div className="glass-panel p-6 animate-slide-up">
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Video Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            placeholder="Enter a title for this video"
          />

          <button
            onClick={handleProcess}
            className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5" />
            <span>Analyze & Optimize Hook</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Zap(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>
  );
}
