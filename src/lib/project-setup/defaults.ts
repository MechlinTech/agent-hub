import type { ProjectSetupConfig } from "@/lib/project-setup/types";

export const DEFAULT_PROJECT_SETUP_CONFIG: ProjectSetupConfig = {
  projectName: "",
  description: "",
  projectScope: "full_stack",
  locationPath: "",
  frontendFramework: "nextjs",
  styling: "tailwind",
  stateManagement: "zustand",
  frontendAuth: "none",
  backendFramework: "express",
  backendAuth: "jwt",
  database: "postgresql",
  swagger: false,
  redis: false,
  socketIo: false,
  docker: false,
  githubActions: false,
  deploymentTarget: "none",
};

export const EXECUTOR_LATEST_VERSION = "1.0.0";
export const EXECUTOR_DEFAULT_PORT = 8787;
export const EXECUTOR_BASE_URL = "http://127.0.0.1:8787";
