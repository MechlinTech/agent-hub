import { z } from "zod";

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
    "Enter an absolute path (e.g. D:\\Projects)"
  );

export const projectSetupConfigSchema = z
  .object({
    projectName: projectNameSchema,
    description: z.string().max(2000).optional().default(""),
    projectScope: z.enum(["frontend_only", "backend_only", "full_stack"]),
    locationPath: locationPathSchema,
    frontendFramework: z.enum(["nextjs", "react"]),
    styling: z.enum(["tailwind", "mui", "shadcn"]),
    stateManagement: z.enum(["redux", "zustand", "context"]),
    frontendAuth: z.enum(["none", "jwt", "google_oauth"]),
    backendFramework: z.enum(["express"]).default("express"),
    backendAuth: z.enum(["jwt", "google_oauth"]),
    database: z.enum(["mongodb", "postgresql"]),
    swagger: z.boolean(),
    redis: z.boolean(),
    socketIo: z.boolean(),
    docker: z.boolean(),
    githubActions: z.boolean(),
    deploymentTarget: z.enum(["none", "railway", "render", "vercel"]),
  })
  .superRefine((data, ctx) => {
    const needsFrontend =
      data.projectScope === "frontend_only" || data.projectScope === "full_stack";
    const needsBackend =
      data.projectScope === "backend_only" || data.projectScope === "full_stack";

    if (needsBackend && data.projectScope === "backend_only" && !data.backendAuth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Backend auth is required",
        path: ["backendAuth"],
      });
    }

    if (!needsFrontend && !needsBackend) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid project scope",
        path: ["projectScope"],
      });
    }

    void needsFrontend;
    void needsBackend;
  });

export type ProjectSetupFormValues = z.infer<typeof projectSetupConfigSchema>;

/** Fill in valid defaults so preview works before project name/location are set. */
export function buildDraftPreviewConfig(
  config: z.input<typeof projectSetupConfigSchema>,
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
