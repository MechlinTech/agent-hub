import { z } from "zod";
import type { AuthMethod, ProjectSetupConfig } from "@/lib/project-setup/types";

const projectNameSchema = z
  .string()
  .min(1, "Project name is required")
  .max(64)
  .regex(/^[a-zA-Z0-9-_]+$/, "Use letters, numbers, hyphens, and underscores only");

const locationPathSchema = z
  .string()
  .min(3, "Project location is required")
  .refine(
    (p) => /^[a-zA-Z]:\\/.test(p) || p.startsWith("/"),
    "Enter an absolute path (e.g. D:\\Projects)",
  );

const authMethodSchema = z.enum(["jwt", "google_oauth", "azure_oauth"]);

function migrateLegacyAuth(input: Record<string, unknown>): Record<string, unknown> {
  if (
    Array.isArray(input.frontendAuthMethods) &&
    Array.isArray(input.backendAuthMethods)
  ) {
    return input;
  }

  const methods = new Set<AuthMethod>();
  const frontendAuth = input.frontendAuth;
  const backendAuth = input.backendAuth;
  const legacyAuthMethods = input.authMethods;

  if (Array.isArray(legacyAuthMethods)) {
    for (const m of legacyAuthMethods) {
      if (m === "jwt" || m === "google_oauth" || m === "azure_oauth") {
        methods.add(m);
      }
    }
    const list = Array.from(methods);
    const { authMethods: _am, frontendAuth: _fa, backendAuth: _ba, ...rest } = input;
    return {
      ...rest,
      frontendAuthMethods: list,
      backendAuthMethods: list,
    };
  }

  const frontendMethods = new Set<AuthMethod>();
  const backendMethods = new Set<AuthMethod>();

  if (frontendAuth === "jwt" || backendAuth === "jwt") {
    frontendMethods.add("jwt");
    backendMethods.add("jwt");
  }
  if (frontendAuth === "google_oauth" || backendAuth === "google_oauth") {
    frontendMethods.add("google_oauth");
    backendMethods.add("google_oauth");
  }
  if (frontendAuth === "azure_oauth" || backendAuth === "azure_oauth") {
    frontendMethods.add("azure_oauth");
    backendMethods.add("azure_oauth");
  }

  const { frontendAuth: _fa, backendAuth: _ba, authMethods: _am, ...rest } = input;
  return {
    ...rest,
    frontendAuthMethods: Array.from(frontendMethods),
    backendAuthMethods: Array.from(backendMethods),
  };
}

export const projectSetupConfigSchema = z
  .preprocess(migrateLegacyAuth, z.object({
    projectName: projectNameSchema,
    description: z.string().max(2000).optional().default(""),
    projectScope: z.enum(["frontend_only", "backend_only", "full_stack"]),
    locationPath: locationPathSchema,
    frontendFramework: z.enum(["nextjs", "react", "flutter", "react-native"]),
    styling: z.enum(["tailwind", "mui", "shadcn"]),
    stateManagement: z.enum(["redux", "zustand", "context"]),
    frontendAuthMethods: z.array(authMethodSchema).default([]),
    backendAuthMethods: z.array(authMethodSchema).default([]),
    backendFramework: z.enum(["express", "nestjs"]).default("express"),
    database: z.enum(["mongodb", "postgresql"]),
    swagger: z.boolean(),
    redis: z.boolean(),
    socketIo: z.boolean(),
    docker: z.boolean(),
    githubActions: z.boolean(),
    deploymentTarget: z.enum(["none", "railway", "render", "vercel"]),
    databaseUrl: z.string().optional().default(""),
    runMigrations: z.boolean().default(false),
    jwtSecret: z.string().optional().default(""),
    googleClientId: z.string().optional().default(""),
    googleClientSecret: z.string().optional().default(""),
    azureClientId: z.string().optional().default(""),
    azureClientSecret: z.string().optional().default(""),
    azureTenantId: z.string().optional().default(""),
    frontendUrl: z.string().optional().default(""),
    apiUrl: z.string().optional().default(""),
  }))
  .superRefine((data, ctx) => {
    const needsFrontend =
      data.projectScope === "frontend_only" || data.projectScope === "full_stack";
    const needsBackend =
      data.projectScope === "backend_only" || data.projectScope === "full_stack";

    if (
      needsBackend &&
      data.projectScope === "backend_only" &&
      data.backendAuthMethods.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one backend authentication method",
        path: ["backendAuthMethods"],
      });
    }

    const frontendOAuth =
      data.frontendAuthMethods.includes("google_oauth") ||
      data.frontendAuthMethods.includes("azure_oauth");

    if (needsFrontend && data.frontendAuthMethods.length > 0 && !data.apiUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "API URL is required when frontend authentication is enabled",
        path: ["apiUrl"],
      });
    }

    if (needsFrontend && frontendOAuth && !data.frontendUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Frontend URL is required when OAuth buttons are enabled",
        path: ["frontendUrl"],
      });
    }

    if (!needsFrontend && !needsBackend) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid project scope",
        path: ["projectScope"],
      });
    }

    const needsPostgres = needsBackend && data.database === "postgresql";
    if (
      needsPostgres &&
      data.databaseUrl?.trim() &&
      !/^postgres(ql)?:\/\//i.test(data.databaseUrl.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL must start with postgresql:// or postgres://",
        path: ["databaseUrl"],
      });
    }

    if (needsPostgres && data.runMigrations && !data.databaseUrl?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "DATABASE_URL is required when running migrations during setup",
        path: ["databaseUrl"],
      });
    }
  });

export type ProjectSetupFormValues = z.infer<typeof projectSetupConfigSchema>;

/** Fill in valid defaults so preview works before project name/location are set. */
export function buildDraftPreviewConfig(
  config: Partial<ProjectSetupConfig>,
): z.infer<typeof projectSetupConfigSchema> {
  const name =
    typeof config.projectName === "string" &&
    /^[a-zA-Z0-9-_]+$/.test(config.projectName.trim())
      ? config.projectName.trim()
      : "MyApp";
  const locationPath =
    typeof config.locationPath === "string" &&
    (/^[a-zA-Z]:\\/.test(config.locationPath) || config.locationPath.startsWith("/"))
      ? config.locationPath
      : "D:\\Projects";

  return projectSetupConfigSchema.parse({
    ...config,
    projectName: name,
    locationPath,
  });
}

export function formatProjectSetupValidationError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => issue.message).join(" · ");
  }
  if (error instanceof Error) return error.message;
  return "Validation failed";
}

export function projectSetupFieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}
