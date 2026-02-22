import { useEffect, useState } from 'react';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
}

const SIZES = {
  sm: { ring: 80, stroke: 6, text: 'text-lg', label: 'text-[10px]' },
  md: { ring: 120, stroke: 8, text: 'text-3xl', label: 'text-xs' },
  lg: { ring: 180, stroke: 10, text: 'text-5xl', label: 'text-sm' },
};

export default function ScoreRing({ score, size = 'md', showLabel = true, animated = true }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
  const config = SIZES[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayScore / 10) * circumference;

  useEffect(() => {
    if (!animated) return;
    let frame: number;
    const start = performance.now();
    const duration = 1500;

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(score * eased * 10) / 10);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  const strokeColor =
    displayScore < 3 ? '#ef4444' : displayScore < 6 ? '#f59e0b' : '#10b981';

  const glowClass =
    score < 3 ? 'score-glow-red' : score < 6 ? 'score-glow-amber' : 'score-glow-green';

  return (
    <div className={cn('relative inline-flex flex-col items-center', glowClass, 'rounded-full')}>
      <svg width={config.ring} height={config.ring} className="-rotate-90">
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={config.stroke}
        />
        <circle
          cx={config.ring / 2}
          cy={config.ring / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={config.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', config.text, getScoreColor(displayScore))}>
          {displayScore.toFixed(1)}
        </span>
        {showLabel && (
          <span className={cn('font-medium text-surface-400', config.label)}>
            {getScoreLabel(score)}
          </span>
        )}
      </div>
    </div>
  );
}
