import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Building2, Users, Loader2, Save, Check, Key, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, agency, membership, loadUserData } = useAuthStore();
  const [tab, setTab] = useState<'profile' | 'agency'>('profile');
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [savedKey, setSavedKey] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? '');
    setAgencyName(agency?.name ?? '');
  }, [profile, agency]);

  useEffect(() => {
    if (agency?.id && tab === 'agency') loadApiKey();
  }, [agency?.id, tab]);

  const loadApiKey = async () => {
    if (!agency) return;
    const { data } = await supabase
      .from('agencies')
      .select('openai_api_key')
      .eq('id', agency.id)
      .maybeSingle();
    if (data?.openai_api_key) {
      setApiKey(data.openai_api_key);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', profile.id);
    await loadUserData();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveAgency = async () => {
    if (!agency) return;
    setSaving(true);
    await supabase.from('agencies').update({ name: agencyName }).eq('id', agency.id);
    await loadUserData();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveApiKey = async () => {
    if (!agency) return;
    setSavingKey(true);
    await supabase
      .from('agencies')
      .update({ openai_api_key: apiKey || null })
      .eq('id', agency.id);
    setSavingKey(false);
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const isOwner = membership?.role === 'owner';
  const maskedKey = apiKey ? `${apiKey.slice(0, 7)}${'*'.repeat(20)}${apiKey.slice(-4)}` : '';

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div className="flex gap-1 bg-surface-800/50 p-1 rounded-lg w-fit">
        {[
          { key: 'profile' as const, label: 'Profile', icon: User },
          { key: 'agency' as const, label: 'Agency', icon: Building2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              tab === key ? 'bg-surface-700 text-white' : 'text-surface-400 hover:text-surface-200'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-lg font-semibold">Profile Settings</h3>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.id ? '' : ''}
              disabled
              className="w-full px-4 py-2.5 bg-surface-800/50 border border-surface-700/50 rounded-lg text-surface-500 text-sm cursor-not-allowed"
              placeholder="Email cannot be changed here"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      )}

      {tab === 'agency' && (
        <>
          <div className="glass-panel p-6 space-y-6">
            <h3 className="text-lg font-semibold">Agency Settings</h3>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Agency Name</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                disabled={!isOwner}
                className={cn(
                  'w-full px-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50',
                  !isOwner && 'opacity-50 cursor-not-allowed'
                )}
              />
              {!isOwner && (
                <p className="text-xs text-surface-500 mt-1">Only agency owners can modify settings.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Plan</label>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1.5 bg-brand-500/10 text-brand-400 rounded-lg text-sm font-medium capitalize">
                  {agency?.plan_tier ?? 'Starter'}
                </span>
                <button
                  onClick={() => navigate('/billing')}
                  className="text-sm text-brand-400 hover:text-brand-300"
                >
                  Manage billing
                </button>
              </div>
            </div>

            <button
              onClick={() => navigate('/team')}
              className="flex items-center gap-2 text-sm text-surface-400 hover:text-surface-200 transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Manage Team Members</span>
            </button>

            {isOwner && (
              <button
                onClick={handleSaveAgency}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>

          {isOwner && (
            <div className="glass-panel p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">API Key</h3>
                  <p className="text-xs text-surface-400">Your OpenAI key for video analysis</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">OpenAI API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={showApiKey ? apiKey : maskedKey}
                    onChange={(e) => {
                      setShowApiKey(true);
                      setApiKey(e.target.value);
                    }}
                    className="w-full px-4 py-2.5 pr-12 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    placeholder="sk-..."
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-200"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-surface-500 mt-2">
                  Your key is used for AI-powered video analysis. If not set, the platform default key is used.
                </p>
              </div>

              <button
                onClick={handleSaveApiKey}
                disabled={savingKey}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {savingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedKey ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>{savedKey ? 'Key Saved!' : savingKey ? 'Saving...' : 'Save API Key'}</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
