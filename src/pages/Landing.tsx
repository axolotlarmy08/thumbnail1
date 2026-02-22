import { useNavigate } from 'react-router-dom';
import {
  Zap,
  BarChart3,
  Image,
  FileText,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Play,
  Star,
  Clock,
  Target,
} from 'lucide-react';
import { PLAN_PRICES } from '@/lib/constants';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-accent-cyan flex items-center justify-center">
              <Zap className="w-5 h-5 text-surface-950" />
            </div>
            <span className="text-lg font-bold">Video Hook Builder</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-2 text-sm font-semibold bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors"
            >
              Start Free
            </button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-8">
            <Clock className="w-4 h-4" />
            <span>Optimize any video hook in under 60 seconds</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            Stop Guessing.
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-cyan bg-clip-text text-transparent">
              Start Scoring.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered hook optimization engine built for agencies. Analyze, score, and
            optimize every client video before it goes live.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/25"
            >
              <span>Start Optimizing</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-surface-700 hover:border-surface-600 text-surface-300 hover:text-white font-medium rounded-xl transition-colors">
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: '60s', label: 'Time to Optimize' },
              { value: '+38%', label: 'Avg CTR Lift' },
              { value: '10K+', label: 'Videos Analyzed' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-xs sm:text-sm text-surface-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 border-t border-surface-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything Your Agency Needs
            </h2>
            <p className="text-surface-400 text-lg max-w-xl mx-auto">
              From hook analysis to client reporting -- one platform for every video.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Target,
                title: 'Hook Score Analysis',
                desc: 'AI scores every hook across 5 critical dimensions. Know exactly what to fix before publishing.',
              },
              {
                icon: Image,
                title: 'Thumbnail Optimization',
                desc: 'Automatically extract the most emotionally intense frame. Compare and download high-res thumbnails.',
              },
              {
                icon: FileText,
                title: 'Caption Generation',
                desc: 'Platform-optimized captions that start with tension. Hashtags, CTAs, and hooks included.',
              },
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                desc: 'Track hook scores, trends, and weaknesses across all client workspaces in real time.',
              },
              {
                icon: Users,
                title: 'Multi-Client Workspaces',
                desc: 'Organize videos by client. Switch between workspaces instantly. Built for agency scale.',
              },
              {
                icon: TrendingUp,
                title: 'Engagement Predictions',
                desc: 'See predicted CTR and watch time lifts before publishing. Data-driven confidence.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="glass-panel p-6 hover:border-surface-600/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 border-t border-surface-800/50 bg-surface-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Agency-Focused Pricing</h2>
            <p className="text-surface-400 text-lg">Scale as your agency grows. No per-seat fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                tier: 'starter' as const,
                features: ['5 client workspaces', '100 videos/month', 'Hook score analysis', 'Thumbnail optimization', 'Caption generation', 'Basic analytics'],
              },
              {
                tier: 'growth' as const,
                popular: true,
                features: ['15 client workspaces', '500 videos/month', 'Everything in Starter', 'Agency-wide analytics', 'Team member access', 'PDF report exports'],
              },
              {
                tier: 'scale' as const,
                features: ['Unlimited workspaces', 'Unlimited videos', 'Everything in Growth', 'White-label reports', 'Priority processing', 'Dedicated support'],
              },
            ].map(({ tier, popular, features }) => {
              const plan = PLAN_PRICES[tier];
              return (
                <div
                  key={tier}
                  className={`relative glass-panel p-8 flex flex-col ${
                    popular ? 'border-brand-500/50 ring-1 ring-brand-500/20' : ''
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-500 text-xs font-bold rounded-full">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-black">${plan.monthly}</span>
                    <span className="text-surface-400 text-sm">/month</span>
                  </div>
                  <ul className="space-y-3 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-surface-300">
                        <CheckCircle2 className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/register')}
                    className={`mt-8 w-full py-3 rounded-lg font-semibold text-sm transition-colors ${
                      popular
                        ? 'bg-brand-500 hover:bg-brand-600 text-white'
                        : 'bg-surface-700 hover:bg-surface-600 text-surface-200'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 border-t border-surface-800/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by Agencies</h2>
            <p className="text-surface-400 text-lg">See what performance-driven teams are saying.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'Sarah K.',
                role: 'Creative Director, Viral Agency',
                text: 'We went from guessing on hooks to data-driven optimization. Our client retention improved dramatically.',
              },
              {
                name: 'Marcus R.',
                role: 'CEO, GrowthScale Media',
                text: 'The hook scoring system is a game-changer. We cut our revision cycles in half and clients see real results.',
              },
              {
                name: 'Elena T.',
                role: 'Head of Content, Apex Digital',
                text: 'The PDF reports alone are worth the subscription. Clients love seeing the data behind our recommendations.',
              },
            ].map((t) => (
              <div key={t.name} className="glass-panel p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-400 text-brand-400" />
                  ))}
                </div>
                <p className="text-sm text-surface-300 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-surface-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 border-t border-surface-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Optimize Every Hook?
          </h2>
          <p className="text-surface-400 text-lg mb-8">
            Join agencies already using data to drive video performance.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-2 px-10 py-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-brand-500/25 text-lg"
          >
            <span>Start Your Free Trial</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="py-10 px-4 sm:px-6 border-t border-surface-800/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-400" />
            <span className="text-sm font-semibold">Video Hook Builder</span>
          </div>
          <p className="text-xs text-surface-500">
            &copy; {new Date().getFullYear()} Video Hook Builder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
