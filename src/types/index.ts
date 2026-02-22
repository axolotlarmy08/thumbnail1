export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  owner_id: string;
  plan_tier: 'starter' | 'growth' | 'scale';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  openai_api_key: string | null;
  created_at: string;
}

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string;
  role: 'owner' | 'member';
  invited_at: string;
  joined_at: string;
  profiles?: Profile;
}

export interface ClientWorkspace {
  id: string;
  agency_id: string;
  client_name: string;
  platform_type: 'tiktok' | 'instagram' | 'youtube_shorts' | 'youtube_long';
  logo_url: string | null;
  is_archived: boolean;
  created_at: string;
  video_count?: number;
  avg_score?: number;
}

export interface Video {
  id: string;
  workspace_id: string;
  title: string;
  file_url: string | null;
  file_size: number;
  duration_seconds: number;
  status: VideoStatus;
  created_at: string;
  hook_scores?: HookScore[];
  thumbnails?: Thumbnail[];
  captions?: Caption[];
  optimization_predictions?: OptimizationPrediction[];
  transcripts?: Transcript[];
}

export type VideoStatus =
  | 'uploading'
  | 'analyzing_transcript'
  | 'detecting_emotions'
  | 'generating_score'
  | 'optimizing_thumbnail'
  | 'generating_caption'
  | 'complete'
  | 'failed';

export interface HookScore {
  id: string;
  video_id: string;
  overall_score: number;
  opening_speed_score: number;
  emotional_spike_score: number;
  visual_impact_score: number;
  curiosity_trigger_score: number;
  caption_tension_score: number;
  recommendations: Recommendation[];
  created_at: string;
}

export interface Recommendation {
  severity: 'critical' | 'moderate' | 'minor';
  message: string;
  category: string;
}

export interface ThumbnailOption {
  url: string;
  timestamp: number;
  index: number;
}

export interface Thumbnail {
  id: string;
  video_id: string;
  selected_frame_url: string | null;
  ai_suggested_frame_url: string | null;
  frame_timestamp: number;
  thumbnail_options: ThumbnailOption[];
  selected_index: number;
  created_at: string;
}

export interface Caption {
  id: string;
  video_id: string;
  caption_text: string;
  hashtags: string[];
  platform_optimized_for: string;
  tone: string;
  created_at: string;
}

export interface OptimizationPrediction {
  id: string;
  video_id: string;
  original_hook_score: number;
  optimized_hook_score: number;
  predicted_ctr_lift: number;
  predicted_watch_time_lift: number;
  created_at: string;
}

export interface Transcript {
  id: string;
  video_id: string;
  full_text: string;
  segments: TranscriptSegment[];
  created_at: string;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}
