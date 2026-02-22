import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { ClientWorkspace } from '@/types';

interface WorkspaceState {
  workspaces: ClientWorkspace[];
  activeWorkspace: ClientWorkspace | null;
  loading: boolean;
  setActiveWorkspace: (workspace: ClientWorkspace | null) => void;
  loadWorkspaces: (agencyId: string) => Promise<void>;
  createWorkspace: (agencyId: string, clientName: string, platformType: string) => Promise<ClientWorkspace | null>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  loading: false,

  setActiveWorkspace: (workspace) => {
    set({ activeWorkspace: workspace });
    if (workspace) {
      localStorage.setItem('activeWorkspaceId', workspace.id);
    }
  },

  loadWorkspaces: async (agencyId) => {
    set({ loading: true });
    const { data } = await supabase
      .from('client_workspaces')
      .select('*')
      .eq('agency_id', agencyId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    const workspaces = (data ?? []) as ClientWorkspace[];
    set({ workspaces, loading: false });

    const savedId = localStorage.getItem('activeWorkspaceId');
    const { activeWorkspace } = get();
    if (!activeWorkspace && workspaces.length > 0) {
      const saved = workspaces.find((w) => w.id === savedId);
      set({ activeWorkspace: saved ?? workspaces[0] });
    }
  },

  createWorkspace: async (agencyId, clientName, platformType) => {
    const { data, error } = await supabase
      .from('client_workspaces')
      .insert({ agency_id: agencyId, client_name: clientName, platform_type: platformType })
      .select()
      .maybeSingle();

    if (error || !data) return null;

    const workspace = data as ClientWorkspace;
    set((state) => ({
      workspaces: [workspace, ...state.workspaces],
      activeWorkspace: workspace,
    }));
    return workspace;
  },
}));
