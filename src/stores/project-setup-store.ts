import { create } from "zustand";
import type { PlanResult, ProjectSetupConfig } from "@/lib/project-setup/types";
import { DEFAULT_PROJECT_SETUP_CONFIG } from "@/lib/project-setup/defaults";
import { scrollAppToTop } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3;

export const PROJECT_SETUP_NEW_PATH = "/agents/project-setup/new";

function scrollAfterStepChange() {
  requestAnimationFrame(() => {
    requestAnimationFrame(scrollAppToTop);
  });
}

interface ProjectSetupState {
  currentStep: WizardStep;
  config: ProjectSetupConfig;
  plan: PlanResult | null;
  jobId: string | null;
  wizardSessionId: number;
  setField: <K extends keyof ProjectSetupConfig>(key: K, value: ProjectSetupConfig[K]) => void;
  setConfig: (config: Partial<ProjectSetupConfig>) => void;
  setPlan: (plan: PlanResult | null) => void;
  setJobId: (id: string | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  startNewSetup: () => void;
}

export const useProjectSetupStore = create<ProjectSetupState>((set, get) => ({
  currentStep: 1,
  config: { ...DEFAULT_PROJECT_SETUP_CONFIG },
  plan: null,
  jobId: null,
  wizardSessionId: 0,
  setField: (key, value) =>
    set({ config: { ...get().config, [key]: value }, plan: null }),
  setConfig: (partial) =>
    set({ config: { ...get().config, ...partial }, plan: null }),
  setPlan: (plan) => set({ plan }),
  setJobId: (jobId) => set({ jobId }),
  nextStep: () => {
    const step = Math.min(3, get().currentStep + 1) as WizardStep;
    if (step === get().currentStep) return;
    set({ currentStep: step });
    scrollAfterStepChange();
  },
  prevStep: () => {
    const step = Math.max(1, get().currentStep - 1) as WizardStep;
    if (step === get().currentStep) return;
    set({ currentStep: step });
    scrollAfterStepChange();
  },
  reset: () =>
    set({
      currentStep: 1,
      config: { ...DEFAULT_PROJECT_SETUP_CONFIG },
      plan: null,
      jobId: null,
    }),
  startNewSetup: () =>
    set((state) => ({
      currentStep: 1,
      config: { ...DEFAULT_PROJECT_SETUP_CONFIG },
      plan: null,
      jobId: null,
      wizardSessionId: state.wizardSessionId + 1,
    })),
}));

/** Reset wizard when opening New Setup (sidebar, overview, or revisiting /new). */
export function beginNewProjectSetup(): void {
  useProjectSetupStore.getState().startNewSetup();
}

export function showFrontend(scope: ProjectSetupConfig["projectScope"]): boolean {
  return scope === "frontend_only" || scope === "full_stack";
}

export function showBackend(scope: ProjectSetupConfig["projectScope"]): boolean {
  return scope === "backend_only" || scope === "full_stack";
}
