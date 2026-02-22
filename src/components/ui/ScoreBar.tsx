import { useEffect, useState } from 'react';
import { cn, getScoreBgColor, getScoreColor } from '@/lib/utils';

interface ScoreBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
  animated?: boolean;
  delay?: number;
}

export default function ScoreBar({ label, score, icon, animated = true, delay = 0 }: ScoreBarProps) {
  const [width, setWidth] = useState(animated ? 0 : (score / 10) * 100);
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const duration = 1200;
      let frame: number;

      const animate = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setWidth((score / 10) * 100 * eased);
        setDisplayScore(Math.round(score * eased * 10) / 10);
        if (progress < 1) frame = requestAnimationFrame(animate);
      };

      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, delay);
    return () => clearTimeout(timeout);
  }, [score, animated, delay]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-surface-400">{icon}</span>
          <span className="text-sm font-medium text-surface-200">{label}</span>
        </div>
        <span className={cn('text-sm font-bold', getScoreColor(score))}>
          {displayScore.toFixed(1)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-700/50 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', getScoreBgColor(score))}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
