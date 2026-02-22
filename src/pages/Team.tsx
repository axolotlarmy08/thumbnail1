import { useEffect, useState } from 'react';
import { UserPlus, Shield, User, X, Loader2, Mail, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { cn, formatDate } from '@/lib/utils';
import type { AgencyMember, Profile } from '@/types';

interface MemberWithProfile extends AgencyMember {
  profiles: Profile;
}

export default function Team() {
  const { agency, membership } = useAuthStore();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'owner' | 'member'>('member');
  const [inviting, setInviting] = useState(false);

  const isOwner = membership?.role === 'owner';

  useEffect(() => {
    if (agency) loadMembers();
  }, [agency]);

  const loadMembers = async () => {
    if (!agency) return;
    const { data } = await supabase
      .from('agency_members')
      .select('*, profiles(*)')
      .eq('agency_id', agency.id)
      .order('joined_at', { ascending: true });

    setMembers((data ?? []) as MemberWithProfile[]);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    await new Promise((r) => setTimeout(r, 1000));
    setInviting(false);
    setShowInvite(false);
    setInviteEmail('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Members</h3>
          <p className="text-sm text-surface-400">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Member</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <div key={m.id} className="glass-panel p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-sm font-bold text-surface-300">
              {m.profiles?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-surface-200 truncate">
                {m.profiles?.full_name || 'Unknown'}
              </p>
              <p className="text-xs text-surface-500">Joined {formatDate(m.joined_at)}</p>
            </div>
            <span
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                m.role === 'owner'
                  ? 'bg-brand-500/10 text-brand-400'
                  : 'bg-surface-700 text-surface-400'
              )}
            >
              {m.role === 'owner' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
              <span className="capitalize">{m.role}</span>
            </span>
            {isOwner && m.role !== 'owner' && (
              <button className="p-2 text-surface-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowInvite(false)} />
          <div className="relative glass-panel p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Invite Team Member</h3>
              <button onClick={() => setShowInvite(false)} className="text-surface-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-800 border border-surface-700 rounded-lg text-white text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    placeholder="team@agency.com"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['member', 'owner'] as const).map((role) => (
                    <button
                      key={role}
                      onClick={() => setInviteRole(role)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg text-sm font-medium border transition-colors capitalize',
                        inviteRole === role
                          ? 'bg-brand-500/10 border-brand-500/50 text-brand-400'
                          : 'bg-surface-800 border-surface-700 text-surface-400 hover:border-surface-600'
                      )}
                    >
                      {role === 'owner' ? 'Agency Owner' : 'Team Member'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 py-2.5 border border-surface-700 text-surface-300 rounded-lg text-sm font-medium hover:bg-surface-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail.trim() || inviting}
                className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {inviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
