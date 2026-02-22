import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile, Agency, AgencyMember } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  agency: Agency | null;
  membership: AgencyMember | null;
  loading: boolean;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  loadUserData: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  agency: null,
  membership: null,
  loading: true,
  initialized: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  loadUserData: async () => {
    const { user } = get();
    if (!user) {
      set({ profile: null, agency: null, membership: null });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const [agencyResult, memberResult] = await Promise.all([
      supabase.rpc('get_user_agency'),
      supabase.rpc('get_user_membership'),
    ]);

    let agency = agencyResult.data as Agency | null;
    let membership = memberResult.data as AgencyMember | null;

    if (!membership) {
      await new Promise((r) => setTimeout(r, 1500));
      const [retryAgency, retryMember] = await Promise.all([
        supabase.rpc('get_user_agency'),
        supabase.rpc('get_user_membership'),
      ]);
      agency = retryAgency.data as Agency | null;
      membership = retryMember.data as AgencyMember | null;
    }

    set({ profile, agency, membership });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      session: null,
      user: null,
      profile: null,
      agency: null,
      membership: null,
    });
  },

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });

    if (session?.user) {
      await get().loadUserData();
    }

    set({ loading: false, initialized: true });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        (async () => {
          await get().loadUserData();
        })();
      } else {
        set({ profile: null, agency: null, membership: null });
      }
    });
  },
}));
