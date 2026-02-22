import { CheckCircle2, Zap, Crown, Building2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { PLAN_PRICES, PLAN_LIMITS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { PlanTier } from '@/lib/constants';

const TIER_ICONS: Record<PlanTier, React.ReactNode> = {
  starter: <Zap className="w-5 h-5" />,
  growth: <Crown className="w-5 h-5" />,
  scale: <Building2 className="w-5 h-5" />,
};

const TIER_FEATURES: Record<PlanTier, string[]> = {
  starter: [
    '5 client workspaces',
    '100 videos per month',
    'Hook score analysis',
    'Thumbnail optimization',
    'Caption generation',
    'Basic analytics',
  ],
  growth: [
    '15 client workspaces',
    '500 videos per month',
    'Everything in Starter',
    'Agency-wide analytics',
    'Team member access',
    'PDF report exports',
  ],
  scale: [
    'Unlimited workspaces',
    'Unlimited videos',
    'Everything in Growth',
    'White-label reports',
    'Priority processing',
    'Dedicated support',
  ],
};

export default function Billing() {
  const { agency } = useAuthStore();
  const { workspaces } = useWorkspaceStore();
  const currentTier = (agency?.plan_tier ?? 'starter') as PlanTier;
  const limits = PLAN_LIMITS[currentTier];

  return (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
              {TIER_ICONS[currentTier]}
            </div>
            <div>
              <h4 className="text-xl font-bold">{PLAN_PRICES[currentTier].name}</h4>
              <p className="text-surface-400 text-sm">
                ${PLAN_PRICES[currentTier].monthly}/month
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-surface-800/50">
              <p className="text-xs text-surface-500">Workspaces Used</p>
              <p className="text-lg font-bold">
                {workspaces.length}
                <span className="text-sm text-surface-500 font-normal">
                  /{limits.workspaces === Infinity ? 'Unlimited' : limits.workspaces}
                </span>
              </p>
              <div className="mt-1 h-1 rounded-full bg-surface-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-400"
                  style={{
                    width: `${limits.workspaces === Infinity ? 10 : (workspaces.length / limits.workspaces) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-800/50">
              <p className="text-xs text-surface-500">Monthly Videos</p>
              <p className="text-lg font-bold">
                0
                <span className="text-sm text-surface-500 font-normal">
                  /{limits.videosPerMonth === Infinity ? 'Unlimited' : limits.videosPerMonth}
                </span>
              </p>
              <div className="mt-1 h-1 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full rounded-full bg-accent-cyan" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">All Plans</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {(['starter', 'growth', 'scale'] as PlanTier[]).map((tier) => {
            const plan = PLAN_PRICES[tier];
            const isCurrent = tier === currentTier;
            const isPopular = tier === 'growth';

            return (
              <div
                key={tier}
                className={cn(
                  'relative glass-panel p-6 flex flex-col',
                  isCurrent && 'ring-2 ring-brand-500/50',
                  isPopular && !isCurrent && 'border-brand-500/30'
                )}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-4 px-3 py-0.5 bg-brand-500 text-xs font-bold rounded-full">
                    CURRENT
                  </div>
                )}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-4 px-3 py-0.5 bg-surface-600 text-xs font-bold rounded-full">
                    POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isCurrent ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-700 text-surface-400'
                  )}>
                    {TIER_ICONS[tier]}
                  </div>
                  <div>
                    <h4 className="font-semibold">{plan.name}</h4>
                    <p className="text-sm text-surface-400">${plan.monthly}/mo</p>
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1">
                  {TIER_FEATURES[tier].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-surface-300">
                      <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className={cn(
                    'mt-6 w-full py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    isCurrent
                      ? 'bg-surface-700 text-surface-500 cursor-not-allowed'
                      : 'bg-brand-500 hover:bg-brand-600 text-white'
                  )}
                >
                  {isCurrent ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
