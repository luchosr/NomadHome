import { create } from "zustand";

/**
 * Client-state store stub. Server state belongs in TanStack Query; this holds
 * only UI/client state. Capability tickets add their own slices.
 */
interface AppState {
  ready: boolean;
  setReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}));
