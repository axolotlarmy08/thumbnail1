export const PLAN_LIMITS = {
  starter: { workspaces: 5, videosPerMonth: 100, whiteLabel: false },
  growth: { workspaces: 15, videosPerMonth: 500, whiteLabel: false },
  scale: { workspaces: Infinity, videosPerMonth: Infinity, whiteLabel: true },
} as const;

export const PLAN_PRICES = {
  starter: { monthly: 97, name: 'Starter Agency' },
  growth: { monthly: 247, name: 'Growth Agency' },
  scale: { monthly: 497, name: 'Scale Agency' },
} as const;

export const PLATFORMS = {
  tiktok: { label: 'TikTok', color: '#000000' },
  instagram: { label: 'Instagram', color: '#E1306C' },
  youtube_shorts: { label: 'YouTube Shorts', color: '#FF0000' },
  youtube_long: { label: 'YouTube Long Form', color: '#FF0000' },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;
export type PlatformType = keyof typeof PLATFORMS;

export const PROCESSING_STEPS = [
  { key: 'uploading', label: 'Uploading video & extracting frames...' },
  { key: 'analyzing_transcript', label: 'Transcribing audio with AI...' },
  { key: 'detecting_emotions', label: 'Detecting emotional spikes...' },
  { key: 'generating_score', label: 'Generating hook score...' },
  { key: 'optimizing_thumbnail', label: 'Analyzing optimization potential...' },
  { key: 'generating_caption', label: 'Generating AI caption...' },
] as const;

export const SCORE_THRESHOLDS = {
  low: 3,
  medium: 6,
  high: 10,
} as const;
