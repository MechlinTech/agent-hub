import type { AuthMethod, ProjectSetupConfig } from "@/lib/project-setup/types";

export function scopeIncludesFrontend(config: ProjectSetupConfig): boolean {
  return config.projectScope === "frontend_only" || config.projectScope === "full_stack";
}

export function scopeIncludesBackend(config: ProjectSetupConfig): boolean {
  return config.projectScope === "backend_only" || config.projectScope === "full_stack";
}

export function usesPrismaBackend(config: ProjectSetupConfig): boolean {
  return scopeIncludesBackend(config) && config.database === "postgresql";
}

export function hasFrontendAuthMethod(
  config: ProjectSetupConfig,
  method: AuthMethod,
): boolean {
  return config.frontendAuthMethods.includes(method);
}

export function hasBackendAuthMethod(
  config: ProjectSetupConfig,
  method: AuthMethod,
): boolean {
  return config.backendAuthMethods.includes(method);
}

/** @deprecated Prefer hasBackendAuthMethod in backend templates */
export function hasAuthMethod(config: ProjectSetupConfig, method: AuthMethod): boolean {
  return hasBackendAuthMethod(config, method);
}

export function usesFrontendAuth(config: ProjectSetupConfig): boolean {
  return config.frontendAuthMethods.length > 0;
}

export function usesBackendAuth(config: ProjectSetupConfig): boolean {
  return config.backendAuthMethods.length > 0;
}

/** @deprecated Prefer usesBackendAuth in backend templates */
export function usesAnyAuth(config: ProjectSetupConfig): boolean {
  return usesBackendAuth(config);
}

export function usesFrontendJwtLogin(config: ProjectSetupConfig): boolean {
  return hasFrontendAuthMethod(config, "jwt");
}

export function usesBackendJwtLogin(config: ProjectSetupConfig): boolean {
  return hasBackendAuthMethod(config, "jwt");
}

/** @deprecated Prefer usesBackendJwtLogin in backend templates */
export function usesJwtLogin(config: ProjectSetupConfig): boolean {
  return usesBackendJwtLogin(config);
}

export function usesFrontendOAuth(config: ProjectSetupConfig): boolean {
  return (
    hasFrontendAuthMethod(config, "google_oauth") ||
    hasFrontendAuthMethod(config, "azure_oauth")
  );
}

export function usesBackendOAuth(config: ProjectSetupConfig): boolean {
  return (
    hasBackendAuthMethod(config, "google_oauth") ||
    hasBackendAuthMethod(config, "azure_oauth")
  );
}

/** @deprecated Prefer usesBackendOAuth in backend templates */
export function usesOAuth(config: ProjectSetupConfig): boolean {
  return usesBackendOAuth(config);
}

/** JWT signing on the backend (login + OAuth callbacks). */
export function needsJwtSigning(config: ProjectSetupConfig): boolean {
  return usesBackendAuth(config);
}

/** @deprecated Use needsJwtSigning or usesJwtLogin */
export function usesJwtAuth(config: ProjectSetupConfig): boolean {
  return needsJwtSigning(config);
}

export function shouldRunPrismaMigrate(config: ProjectSetupConfig): boolean {
  return (
    usesPrismaBackend(config) &&
    config.runMigrations &&
    Boolean(config.databaseUrl?.trim())
  );
}

export function backendEnvRel(config: ProjectSetupConfig): string {
  return config.projectScope === "backend_only" ? ".env" : "backend/.env";
}

export function frontendEnvRel(config: ProjectSetupConfig): string {
  return config.projectScope === "frontend_only" ? ".env" : "frontend/.env";
}

export function hasBackendEnvValues(config: ProjectSetupConfig): boolean {
  return Boolean(
    config.databaseUrl?.trim() ||
      config.jwtSecret?.trim() ||
      config.googleClientId?.trim() ||
      config.azureClientId?.trim(),
  );
}

export function hasFrontendEnvValues(config: ProjectSetupConfig): boolean {
  if (
    config.frontendFramework === "flutter" ||
    config.frontendFramework === "react-native"
  ) {
    return Boolean(config.apiUrl?.trim());
  }
  if (!usesFrontendAuth(config)) return false;
  return Boolean(
    config.apiUrl?.trim() ||
      (usesFrontendOAuth(config) && config.frontendUrl?.trim()),
  );
}

export function defaultFrontendUrl(config: ProjectSetupConfig): string {
  if (config.frontendUrl?.trim()) return config.frontendUrl.trim();
  if (config.frontendFramework === "flutter" || config.frontendFramework === "react-native") {
    return "";
  }
  return config.frontendFramework === "react"
    ? "http://localhost:5173"
    : "http://localhost:3000";
}

export function defaultApiUrl(config: ProjectSetupConfig): string {
  return config.apiUrl?.trim() || "http://localhost:4000";
}

export function frontendApiEnvKey(config: ProjectSetupConfig): string {
  if (config.frontendFramework === "flutter" || config.frontendFramework === "react-native") {
    return "API_BASE_URL";
  }
  return config.frontendFramework === "react" ? "VITE_API_URL" : "NEXT_PUBLIC_API_URL";
}

export function frontendUrlEnvKey(config: ProjectSetupConfig): string {
  if (config.frontendFramework === "flutter" || config.frontendFramework === "react-native") {
    return "FRONTEND_URL";
  }
  return config.frontendFramework === "react"
    ? "VITE_FRONTEND_URL"
    : "NEXT_PUBLIC_FRONTEND_URL";
}

export function frontendFrameworkLabel(config: ProjectSetupConfig): string {
  switch (config.frontendFramework) {
    case "nextjs":
      return "Next.js";
    case "react":
      return "React (Vite)";
    case "flutter":
      return "Flutter (GetX)";
    case "react-native":
      return "React Native CLI";
  }
}

export function frontendStackLabel(config: ProjectSetupConfig): string {
  if (config.frontendFramework === "flutter") {
    return "Flutter (GetX)";
  }
  if (config.frontendFramework === "react-native") {
    return "React Native CLI";
  }
  return `${config.frontendFramework} + ${config.styling}`;
}

/** Env vars for backend setup commands (Prisma migrate dev, etc.). */
export function backendCommandEnv(config: ProjectSetupConfig): Record<string, string> | undefined {
  const env: Record<string, string> = {};
  if (config.databaseUrl?.trim()) env.DATABASE_URL = config.databaseUrl.trim();
  if (config.jwtSecret?.trim()) env.JWT_SECRET = config.jwtSecret.trim();
  return Object.keys(env).length > 0 ? env : undefined;
}

export function frontendRelPrefix(config: ProjectSetupConfig): string {
  return config.projectScope === "frontend_only" ? "" : "frontend/";
}

export function backendRelPrefix(config: ProjectSetupConfig): string {
  return config.projectScope === "backend_only" ? "" : "backend/";
}

function authMethodLabel(method: AuthMethod): string {
  switch (method) {
    case "jwt":
      return "JWT (email/password)";
    case "google_oauth":
      return "Google OAuth";
    case "azure_oauth":
      return "Azure / Microsoft OAuth";
  }
}

export function readmeAuthSection(config: ProjectSetupConfig): string[] {
  const fe = config.frontendAuthMethods;
  const be = config.backendAuthMethods;
  if (fe.length === 0 && be.length === 0) return [];

  const lines = ["## Authentication", ""];

  if (scopeIncludesFrontend(config) && fe.length > 0) {
    lines.push("### Frontend login page", "", "Shows:");
    lines.push(...fe.map((m) => `- ${authMethodLabel(m)}`));
    lines.push("");
  }

  if (scopeIncludesBackend(config) && be.length > 0) {
    lines.push("### Backend API", "", "Implements:");
    lines.push(...be.map((m) => `- ${authMethodLabel(m)}`));
    lines.push("");
  }

  if (config.projectScope === "frontend_only" && usesFrontendOAuth(config)) {
    lines.push(
      "OAuth buttons redirect to your **API URL** (`/api/auth/google` and `/api/auth/azure`).",
      "Point `VITE_API_URL` / `NEXT_PUBLIC_API_URL` at an API that implements those routes.",
      "",
    );
  }

  lines.push(
    "### When to configure",
    "",
    "1. **Before first run** — copy `.env.example` to `.env` and fill in values.",
    "2. **Before OAuth testing** — register redirect URIs with your OAuth provider.",
    "3. **Before production** — rotate secrets and use HTTPS URLs.",
    "",
  );

  if (scopeIncludesFrontend(config) && usesFrontendAuth(config)) {
    const apiKey = frontendApiEnvKey(config);
    const feKey = frontendUrlEnvKey(config);
    lines.push(
      "### Frontend environment",
      "",
      "| Variable | Required | Description |",
      "| -------- | -------- | ----------- |",
      `| \`${apiKey}\` | Yes | Backend API base URL |`,
    );
    if (usesFrontendOAuth(config)) {
      lines.push(`| \`${feKey}\` | OAuth | Frontend origin for callback page |`);
    }
    lines.push("");
  }

  if (scopeIncludesBackend(config) && usesBackendAuth(config)) {
    lines.push(
      "### Backend environment",
      "",
      "| Variable | Required | Description |",
      "| -------- | -------- | ----------- |",
    );
    if (needsJwtSigning(config)) {
      lines.push("| `JWT_SECRET` | Yes | Token signing secret |");
    }
    if (hasBackendAuthMethod(config, "google_oauth")) {
      lines.push("| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |");
      lines.push("| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |");
    }
    if (hasBackendAuthMethod(config, "azure_oauth")) {
      lines.push("| `AZURE_TENANT_ID` | Yes | Azure AD tenant ID |");
      lines.push("| `AZURE_CLIENT_ID` | Yes | Azure app client ID |");
      lines.push("| `AZURE_CLIENT_SECRET` | Yes | Azure app client secret |");
    }
    if (usesBackendOAuth(config)) {
      lines.push("| `FRONTEND_URL` | Yes | OAuth redirect target (frontend origin) |");
    }
    lines.push("");
  }

  if (scopeIncludesBackend(config) && hasBackendAuthMethod(config, "google_oauth")) {
    lines.push(
      "### Google OAuth setup",
      "",
      "1. Create an OAuth client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials).",
      `2. Add authorized redirect URI: \`${defaultApiUrl(config)}/api/auth/google/callback\`.`,
      "3. Copy Client ID and Client Secret into backend `.env`.",
      "",
    );
  }

  if (scopeIncludesBackend(config) && hasBackendAuthMethod(config, "azure_oauth")) {
    lines.push(
      "### Azure / Microsoft OAuth setup",
      "",
      "1. Register an app in [Azure Portal](https://portal.azure.com) → App registrations.",
      "2. Add a **Web** redirect URI:",
      `   \`${defaultApiUrl(config)}/api/auth/azure/callback\``,
      "3. Create a client secret under **Certificates & secrets**.",
      "4. Copy Tenant ID, Client ID, and secret into backend `.env`.",
      "",
    );
  }

  if (scopeIncludesBackend(config) && usesBackendJwtLogin(config)) {
    lines.push(
      "### JWT API",
      "",
      "- Register: `POST /api/auth/register` with `{ email, password }`",
      "- Login: `POST /api/auth/login` with `{ email, password }`",
      "- Current user: `GET /api/auth/me` with `Authorization: Bearer <token>`",
      "",
    );
  }

  return lines;
}

export function readmeBackendSection(config: ProjectSetupConfig): string[] {
  const dir = config.projectScope === "backend_only" ? "." : "backend";
  const framework =
    config.backendFramework === "express" ? "Express.js" : "NestJS";

  const lines = [
    "## Backend",
    "",
    `Stack: **${framework}** + **${config.database}**`,
    "",
    "### Quick start",
    "",
    `\`\`\`bash`,
    `cd ${dir === "." ? "." : dir}`,
    "cp .env.example .env   # fill in values",
    "npm install",
    "npm run dev",
    `\`\`\``,
    "",
    "### Environment variables",
    "",
    "| Variable | Required | Description |",
    "| -------- | -------- | ----------- |",
    "| `PORT` | No | API port (default 4000) |",
  ];

  if (config.database === "postgresql") {
    lines.push("| `DATABASE_URL` | Yes | PostgreSQL connection string |");
  } else {
    lines.push("| `MONGODB_URI` | Yes | MongoDB connection string |");
  }

  if (config.swagger) {
    if (config.backendFramework === "express") {
      lines.push(
        "### API documentation",
        "",
        "Swagger UI is available at `/api-docs` when the server is running.",
        "The OpenAPI spec lives in `src/config/swagger.ts`.",
        "",
      );
    } else {
      lines.push(
        "### API documentation",
        "",
        "Swagger UI is available at `/api-docs` when the server is running.",
        "Controllers and DTOs include `@nestjs/swagger` decorators; setup is in `src/main.ts`.",
        "",
      );
    }
  }

  lines.push("");
  return lines;
}

export function readmeFrontendSection(config: ProjectSetupConfig): string[] {
  const dir = config.projectScope === "frontend_only" ? "." : "frontend";
  const framework = frontendFrameworkLabel(config);

  if (config.frontendFramework === "flutter") {
    return [
      "## Frontend",
      "",
      `Stack: **${framework}**`,
      "",
      "### Quick start",
      "",
      "```bash",
      `cd ${dir === "." ? "." : dir}`,
      "cp .env.example .env   # set API_BASE_URL",
      "flutter pub get",
      "flutter run",
      "```",
      "",
      "### Notifications",
      "",
      "- Foreground: `FirebaseMessaging.onMessage`",
      "- Background tap: `FirebaseMessaging.onMessageOpenedApp`",
      "- Killed / cold-start: `getInitialMessage()` + AwesomeNotifications initial action",
      "",
      "Run `flutterfire configure` to replace `lib/firebase_options.dart`.",
      "",
    ];
  }

  if (config.frontendFramework === "react-native") {
    return [
      "## Frontend",
      "",
      `Stack: **${framework}**`,
      "",
      "### Quick start",
      "",
      "```bash",
      `cd ${dir === "." ? "." : dir}`,
      "cp .env.example .env   # set API_BASE_URL",
      "npm install",
      "cd ios && pod install && cd ..   # macOS only",
      "npm run android   # or npm run ios",
      "```",
      "",
      "### Notifications",
      "",
      "- Foreground receive: FCM `onMessage` → Notifee local notification",
      "- Foreground tap: `notifee.onForegroundEvent`",
      "- Background receive: `setBackgroundMessageHandler` (data-only messages)",
      "- Background tap: `onNotificationOpenedApp` + `notifee.onBackgroundEvent`",
      "- Killed / cold-start: `getInitialNotification` + `notifee.getInitialNotification`",
      "",
      "Replace placeholder Firebase config files (`google-services.json`, `GoogleService-Info.plist`).",
      "",
    ];
  }

  const lines = [
    "## Frontend",
    "",
    `Stack: **${framework}** + **${config.styling}** + **${config.stateManagement}**`,
    "",
    "### Quick start",
    "",
    `\`\`\`bash`,
    `cd ${dir === "." ? "." : dir}`,
    "cp .env.example .env   # fill in values when auth is enabled",
    "npm install",
    "npm run dev",
    `\`\`\``,
    "",
  ];

  if (usesFrontendAuth(config)) {
    lines.push(
      "### Auth routes",
      "",
      "- `/login` — sign in (JWT form and/or OAuth buttons)",
      "- `/auth/callback` — OAuth callback handler (token in query string)",
      "",
    );
  }

  return lines;
}

export function readmeDevOpsSection(config: ProjectSetupConfig): string[] {
  const items: string[] = [];
  if (config.docker) items.push("- **Docker** — see `docker-compose.yml` at project root");
  if (config.githubActions) items.push("- **GitHub Actions** — CI workflow in `.github/workflows/`");
  if (config.deploymentTarget !== "none") {
    items.push(`- **Deploy target** — ${config.deploymentTarget} stub included`);
  }
  if (items.length === 0) return [];

  return ["## DevOps", "", ...items, ""];
}

export function readmeContent(config: ProjectSetupConfig): string {
  const lines = [
    `# ${config.projectName}`,
    "",
    config.description || "Generated by AgentHub Project Setup Agent.",
    "",
    "## Scope",
    "",
    config.projectScope.replace(/_/g, " "),
    "",
  ];

  if (config.projectScope === "full_stack") {
    lines.push(
      "## Overview",
      "",
      "Monorepo with separate frontend and backend apps.",
      "",
      "- Frontend: see `frontend/README.md`",
      "- Backend: see `backend/README.md`",
      "",
      "### Quick start (both apps)",
      "",
      "1. Copy `.env.example` → `.env` in `frontend/` and `backend/`.",
      "2. Start backend: `cd backend && npm install && npm run dev`",
      "3. Start frontend: `cd frontend && npm install && npm run dev`",
      "",
    );
  } else if (config.projectScope === "backend_only") {
    lines.push(...readmeBackendSection(config));
  } else {
    lines.push(...readmeFrontendSection(config));
  }

  lines.push(...readmeAuthSection(config));
  lines.push(...readmeDevOpsSection(config));

  if (usesPrismaBackend(config)) {
    const backendDir = config.projectScope === "backend_only" ? "." : "backend";
    lines.push(
      "## Prisma (PostgreSQL)",
      "",
      "This project was scaffolded with the latest Prisma available at generation time.",
      "",
      "### Database setup",
      "",
      "1. Set `DATABASE_URL` in `.env` (copy from `.env.example`).",
      "2. Run `npx prisma migrate dev` when you are ready to apply migrations.",
      "",
      `From the \`${backendDir}\` folder:`,
      "",
      "```bash",
      "npx prisma migrate dev",
      "```",
      "",
    );
  }

  return lines.join("\n");
}

export function backendEnvExampleContent(config: ProjectSetupConfig): string {
  const lines = ["# Backend environment", ""];

  if (scopeIncludesBackend(config)) {
    lines.push("PORT=4000");
    if (config.database === "postgresql") {
      lines.push('DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"');
    } else {
      lines.push("MONGODB_URI=mongodb://localhost:27017/mydb");
    }
  }

  if (usesBackendAuth(config) && scopeIncludesBackend(config)) {
    lines.push("", "# Auth");
    if (needsJwtSigning(config)) {
      lines.push('JWT_SECRET="change-me"');
    }
    if (hasBackendAuthMethod(config, "google_oauth")) {
      lines.push("GOOGLE_CLIENT_ID=", "GOOGLE_CLIENT_SECRET=");
    }
    if (hasBackendAuthMethod(config, "azure_oauth")) {
      lines.push("AZURE_TENANT_ID=", "AZURE_CLIENT_ID=", "AZURE_CLIENT_SECRET=");
    }
    if (usesBackendOAuth(config)) {
      lines.push(`FRONTEND_URL="${defaultFrontendUrl(config)}"`);
    }
  }

  return `${lines.join("\n")}\n`;
}

export function frontendEnvExampleContent(config: ProjectSetupConfig): string {
  if (!scopeIncludesFrontend(config)) {
    return "";
  }

  if (config.frontendFramework === "flutter" || config.frontendFramework === "react-native") {
    return [
      "# Frontend environment",
      "",
      `API_BASE_URL="${defaultApiUrl(config)}"`,
      "",
    ].join("\n");
  }

  if (!usesFrontendAuth(config)) {
    return "";
  }

  const apiKey = frontendApiEnvKey(config);
  const feKey = frontendUrlEnvKey(config);
  const lines = [
    "# Frontend environment",
    "",
    `${apiKey}="${defaultApiUrl(config)}"`,
  ];
  if (usesFrontendOAuth(config)) {
    lines.push(`${feKey}="${defaultFrontendUrl(config)}"`);
  }
  lines.push("");
  return lines.join("\n");
}

/** Frontend .env written during setup when the user provides API / origin URLs. */
export function frontendEnvFileContent(config: ProjectSetupConfig): string {
  if (
    !scopeIncludesFrontend(config) ||
    (!usesFrontendAuth(config) &&
      config.frontendFramework !== "flutter" &&
      config.frontendFramework !== "react-native")
  ) {
    return "";
  }

  if (
    (config.frontendFramework === "flutter" ||
      config.frontendFramework === "react-native") &&
    config.apiUrl?.trim()
  ) {
    return [
      "# Generated by AgentHub Project Setup Agent",
      "",
      `API_BASE_URL=${defaultApiUrl(config)}`,
      "",
    ].join("\n");
  }

  if (!usesFrontendAuth(config)) {
    return "";
  }

  const apiKey = frontendApiEnvKey(config);
  const feKey = frontendUrlEnvKey(config);
  const lines = [
    "# Generated by AgentHub Project Setup Agent",
    "",
    `${apiKey}=${defaultApiUrl(config)}`,
  ];
  if (usesFrontendOAuth(config)) {
    lines.push(`${feKey}=${defaultFrontendUrl(config)}`);
  }
  return `${lines.join("\n")}\n`;
}

/** Root .env.example — pointers for full_stack; full content for single-scope projects. */
export function envExampleContent(config: ProjectSetupConfig): string {
  if (config.projectScope === "full_stack") {
    const lines = [
      "# Generated by AgentHub Project Setup Agent",
      "",
      "# Full-stack projects use per-app env files:",
      "#   backend/.env.example  — API, database, auth secrets",
      "#   frontend/.env.example — API URL and frontend origin",
      "",
      "See README.md for setup steps.",
      "",
    ];
    return lines.join("\n");
  }

  if (config.projectScope === "backend_only") {
    return backendEnvExampleContent(config);
  }

  return frontendEnvExampleContent(config) || "# No environment variables required\n";
}

/** Backend .env written during setup when the user provides credentials. */
export function envFileContent(config: ProjectSetupConfig): string {
  const lines = ["# Generated by AgentHub Project Setup Agent", "", "PORT=4000"];

  if (usesPrismaBackend(config) && config.databaseUrl?.trim()) {
    lines.push(`DATABASE_URL=${config.databaseUrl.trim()}`);
  }

  if (config.database === "mongodb") {
    lines.push(`MONGODB_URI=mongodb://localhost:27017/${slugify(config.projectName)}`);
  }

  if (needsJwtSigning(config) && config.jwtSecret?.trim()) {
    lines.push("", "# Auth", `JWT_SECRET=${config.jwtSecret.trim()}`);
  }

  if (hasBackendAuthMethod(config, "google_oauth")) {
    if (config.googleClientId?.trim()) lines.push(`GOOGLE_CLIENT_ID=${config.googleClientId.trim()}`);
    if (config.googleClientSecret?.trim()) {
      lines.push(`GOOGLE_CLIENT_SECRET=${config.googleClientSecret.trim()}`);
    }
  }

  if (hasBackendAuthMethod(config, "azure_oauth")) {
    if (config.azureTenantId?.trim()) lines.push(`AZURE_TENANT_ID=${config.azureTenantId.trim()}`);
    if (config.azureClientId?.trim()) lines.push(`AZURE_CLIENT_ID=${config.azureClientId.trim()}`);
    if (config.azureClientSecret?.trim()) {
      lines.push(`AZURE_CLIENT_SECRET=${config.azureClientSecret.trim()}`);
    }
  }

  if (usesBackendOAuth(config)) {
    lines.push(`FRONTEND_URL=${defaultFrontendUrl(config)}`);
  }

  return `${lines.join("\n")}\n`;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "app"
  );
}

export function backendReadmeContent(config: ProjectSetupConfig): string {
  const lines = [
    `# ${config.projectName} Backend`,
    "",
    ...readmeBackendSection(config),
    ...readmeAuthSection(config),
  ];
  return lines.join("\n");
}

export function frontendReadmeContent(config: ProjectSetupConfig): string {
  const lines = [
    `# ${config.projectName} Frontend`,
    "",
    ...readmeFrontendSection(config),
    ...readmeAuthSection(config),
  ];
  return lines.join("\n");
}
