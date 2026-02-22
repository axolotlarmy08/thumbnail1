import { supabase } from '@/lib/supabase';

interface ExtractedFrame {
  blob: Blob;
  timestamp: number;
  index: number;
}

interface UploadedFrame {
  url: string;
  timestamp: number;
  index: number;
}

function loadVideo(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      video.onloadedmetadata = null;
      resolve(video);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    video.currentTime = time;
    video.onseeked = () => {
      video.onseeked = null;
      resolve();
    };
  });
}

function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context unavailable'));
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Frame capture failed'));
      },
      'image/jpeg',
      0.92
    );
  });
}

export async function extractFrames(file: File, count = 3): Promise<ExtractedFrame[]> {
  const video = await loadVideo(file);
  const duration = video.duration;
  const frames: ExtractedFrame[] = [];
  const positions = Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * duration);

  for (let i = 0; i < positions.length; i++) {
    await seekToTime(video, positions[i]);
    const blob = await captureFrame(video);
    frames.push({ blob, timestamp: positions[i], index: i });
  }

  URL.revokeObjectURL(video.src);
  return frames;
}

export async function uploadFrames(
  frames: ExtractedFrame[],
  videoId: string
): Promise<UploadedFrame[]> {
  const uploaded: UploadedFrame[] = [];

  for (const frame of frames) {
    const path = `${videoId}/frame_${frame.index}.jpg`;
    const { error } = await supabase.storage
      .from('thumbnails')
      .upload(path, frame.blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw new Error(`Failed to upload frame ${frame.index}: ${error.message}`);

    const { data: urlData } = supabase.storage.from('thumbnails').getPublicUrl(path);

    uploaded.push({
      url: urlData.publicUrl,
      timestamp: frame.timestamp,
      index: frame.index,
    });
  }

  return uploaded;
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const url = URL.createObjectURL(file);
    video.src = url;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read video metadata'));
    };
  });
}
