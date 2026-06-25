import { create } from "zustand";

interface ExecutorSessionState {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useExecutorSessionStore = create<ExecutorSessionState>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));
