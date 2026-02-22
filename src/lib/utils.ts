export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getScoreColor(score: number): string {
  if (score < 3) return 'text-score-red';
  if (score < 6) return 'text-score-amber';
  return 'text-score-green';
}

export function getScoreBgColor(score: number): string {
  if (score < 3) return 'bg-score-red';
  if (score < 6) return 'bg-score-amber';
  return 'bg-score-green';
}

export function getScoreLabel(score: number): string {
  if (score < 3) return 'Weak';
  if (score < 5) return 'Below Average';
  if (score < 7) return 'Average';
  if (score < 8.5) return 'Strong';
  return 'Exceptional';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
