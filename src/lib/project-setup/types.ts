export type ProjectScope = "frontend_only" | "backend_only" | "full_stack";

export type FrontendFramework = "nextjs" | "react";
export type StylingOption = "tailwind" | "mui" | "shadcn";
export type StateManagement = "redux" | "zustand" | "context";
export type AuthMethod = "jwt" | "google_oauth" | "azure_oauth";

export type BackendFramework = "express" | "nestjs";
export type DatabaseOption = "mongodb" | "postgresql";
export type DeploymentTarget = "none" | "railway" | "render" | "vercel";

export interface ProjectSetupConfig {
  projectName: string;
  description: string;
  projectScope: ProjectScope;
  locationPath: string;
  frontendFramework: FrontendFramework;
  styling: StylingOption;
  stateManagement: StateManagement;
  /** Auth methods scaffolded on the frontend login page. */
  frontendAuthMethods: AuthMethod[];
  /** Auth routes and providers scaffolded on the backend API. */
  backendAuthMethods: AuthMethod[];
  backendFramework: BackendFramework;
  database: DatabaseOption;
  swagger: boolean;
  redis: boolean;
  socketIo: boolean;
  docker: boolean;
  githubActions: boolean;
  deploymentTarget: DeploymentTarget;
  /** Optional — written to .env when PostgreSQL is selected. */
  databaseUrl: string;
  /** When true and DATABASE_URL is set, runs prisma migrate dev during setup. */
  runMigrations: boolean;
  /** Optional — written to .env when JWT auth is selected. */
  jwtSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  azureClientId: string;
  azureClientSecret: string;
  azureTenantId: string;
  /** OAuth redirect target and frontend app origin, e.g. http://localhost:5173 */
  frontendUrl: string;
  /** Backend API base URL for frontend requests, e.g. http://localhost:4000 */
  apiUrl: string;
}

export interface ProjectSetupResult {
  success: boolean;
  projectName: string;
  location: string;
  generatedFiles: string[];
  executedCommands: string[];
  logs: string[];
  duration: string;
}

export type ProjectSetupStatus = "draft" | "generating" | "completed" | "failed";

export interface ProjectSetupLogEntry {
  message: string;
  level: "info" | "warn" | "error";
  timestamp: string;
}

export interface ProjectSetupRecord {
  id: string;
  externalId: string;
  projectName: string;
  projectScope: ProjectScope;
  locationPath: string;
  config: ProjectSetupConfig;
  status: ProjectSetupStatus;
  progressPercent: number;
  currentStep: string | null;
  result: ProjectSetupResult | null;
  logs: ProjectSetupLogEntry[];
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommandStep {
  id: string;
  label: string;
  exe: string;
  args: string[];
  cwd?: string;
  allowShell?: boolean;
  timeoutMs?: number;
  /** pre = before template files (scaffolding); post = after files (default). */
  phase?: "pre" | "post";
  /** Optional env vars passed to child processes (e.g. DATABASE_URL for prisma migrate dev). */
  env?: Record<string, string>;
}

export interface FileTemplate {
  relativePath: string;
  content: string;
  /** pre = before post commands (default); post = after (e.g. fix tsconfig after shadcn init). */
  writePhase?: "pre" | "post";
}

export interface PlanResult {
  folderTree: string[];
  files: FileTemplate[];
  commands: CommandStep[];
  checklist: string[];
  dependencies: string[];
  estimatedMinutes: number;
}
