import type { ProjectSetupConfig } from "@/lib/project-setup/types";

export const DEFAULT_PROJECT_SETUP_CONFIG: ProjectSetupConfig = {
  projectName: "",
  description: "",
  projectScope: "full_stack",
  locationPath: "",
  frontendFramework: "nextjs",
  styling: "tailwind",
  stateManagement: "zustand",
  frontendAuthMethods: ["jwt", "google_oauth", "azure_oauth"],
  backendAuthMethods: ["jwt", "google_oauth", "azure_oauth"],
  backendFramework: "express",
  database: "postgresql",
  swagger: false,
  redis: false,
  socketIo: false,
  docker: false,
  githubActions: false,
  deploymentTarget: "none",
  databaseUrl: "",
  runMigrations: false,
  jwtSecret: "",
  googleClientId: "",
  googleClientSecret: "",
  azureClientId: "",
  azureClientSecret: "",
  azureTenantId: "",
  frontendUrl: "http://localhost:3000",
  apiUrl: "http://localhost:4000",
};

export const EXECUTOR_DEFAULT_PORT = 8787;
export const EXECUTOR_BASE_URL = "http://127.0.0.1:8787";
