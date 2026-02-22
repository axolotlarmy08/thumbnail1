import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface-950 flex">
      <div className="hidden lg:flex flex-1 relative bg-surface-900 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-400 to-accent-cyan flex items-center justify-center">
              <Zap className="w-7 h-7 text-surface-950" />
            </div>
            <h1 className="text-2xl font-bold">Video Hook Builder</h1>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Optimize video hooks with
            <span className="bg-gradient-to-r from-brand-400 to-accent-cyan bg-clip-text text-transparent">
              {' '}AI-powered scoring
            </span>
          </h2>
          <p className="text-surface-400 leading-relaxed">
            Upload, analyze, and perfect every video hook before it goes live. Built for agencies
            managing multiple client accounts.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { val: '0-10', label: 'Hook Score' },
              { val: '<60s', label: 'Processing' },
              { val: '5', label: 'Score Dimensions' },
              { val: 'PDF', label: 'Client Reports' },
            ].map((s) => (
              <div key={s.label} className="glass-panel-sm p-4">
                <p className="text-xl font-bold text-brand-400">{s.val}</p>
                <p className="text-xs text-surface-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-400 to-accent-cyan flex items-center justify-center">
              <Zap className="w-5 h-5 text-surface-950" />
            </div>
            <span className="text-xl font-bold">Video Hook Builder</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-surface-400 text-sm mb-8">Sign in to your agency account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                placeholder="you@agency.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
