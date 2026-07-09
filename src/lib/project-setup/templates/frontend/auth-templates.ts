import type { StackModule } from "@/lib/project-setup/templates/registry";
import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { installLatestArgs } from "@/lib/project-setup/templates/package-latest";
import {
  defaultApiUrl,
  frontendReadmeContent,
  frontendRelPrefix,
  hasFrontendAuthMethod,
  scopeIncludesFrontend,
  usesFrontendAuth,
  usesFrontendJwtLogin,
  usesFrontendOAuth,
} from "@/lib/project-setup/templates/shared";
import {
  buildNextRootLayout,
  buildViteMainEntry,
  dashboardMuiImports,
  frontendDashboardShell,
  nextFontCssFile,
  usesTailwindStyling,
} from "@/lib/project-setup/templates/frontend/styling-templates";

function oauthButtonsSource(config: ProjectSetupConfig, authImport: string): string {
  if (usesTailwindStyling(config)) {
  return `"use client";

import { oauthStartUrl } from "${authImport}/api";

const SHOW_GOOGLE = ${hasFrontendAuthMethod(config, "google_oauth")};
const SHOW_AZURE = ${hasFrontendAuthMethod(config, "azure_oauth")};

function GoogleIcon() {
  return (
    <svg width={20} height={20} className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width={20} height={20} className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

const oauthButtonClass =
  "flex w-full items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400";

export function OAuthButtons() {
  if (!SHOW_GOOGLE && !SHOW_AZURE) return null;

  return (
    <div className="flex flex-col gap-3">
      {SHOW_GOOGLE ? (
        <a href={oauthStartUrl("google")} className={oauthButtonClass}>
          <GoogleIcon />
          Sign in with Google
        </a>
      ) : null}
      {SHOW_AZURE ? (
        <a href={oauthStartUrl("azure")} className={oauthButtonClass}>
          <MicrosoftIcon />
          Sign in with Microsoft
        </a>
      ) : null}
    </div>
  );
}
`;
  }

  return `"use client";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { oauthStartUrl } from "${authImport}/api";

const SHOW_GOOGLE = ${hasFrontendAuthMethod(config, "google_oauth")};
const SHOW_AZURE = ${hasFrontendAuthMethod(config, "azure_oauth")};

function GoogleIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

export function OAuthButtons() {
  if (!SHOW_GOOGLE && !SHOW_AZURE) return null;

  return (
    <Stack spacing={1.5}>
      {SHOW_GOOGLE ? (
        <Button
          component="a"
          href={oauthStartUrl("google")}
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
        >
          Sign in with Google
        </Button>
      ) : null}
      {SHOW_AZURE ? (
        <Button
          component="a"
          href={oauthStartUrl("azure")}
          variant="outlined"
          fullWidth
          startIcon={<MicrosoftIcon />}
        >
          Sign in with Microsoft
        </Button>
      ) : null}
    </Stack>
  );
}
`;
}

function loginFormSource(config: ProjectSetupConfig, authImport: string): string {
  const showOAuth = usesFrontendOAuth(config);
  const oauthImport = showOAuth ? 'import { OAuthButtons } from "./OAuthButtons";\n' : "";
  const oauthBlock = showOAuth ? "{mode === \"login\" ? <OAuthButtons /> : <></>}" : "<></>";
  const oauthDivider =
    showOAuth && usesFrontendJwtLogin(config)
      ? "mode === \"login\" && SHOW_JWT && SHOW_OAUTH"
      : "false";

  if (!usesTailwindStyling(config)) {
    return `"use client";

import { FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useAuth } from "${authImport}/AuthProvider";
${oauthImport}
const SHOW_JWT = ${usesFrontendJwtLogin(config)};
const SHOW_OAUTH = ${showOAuth};

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Paper elevation={2} sx={{ width: "100%", maxWidth: 400, p: 3 }}>
      <Stack spacing={2.5}>
        <Typography variant="h5" component="h1">
          {mode === "login" ? "Sign in" : "Create account"}
        </Typography>
        ${oauthBlock}
        {${oauthDivider} ? (
          <Divider>Or continue with email</Divider>
        ) : null}
        {SHOW_JWT ? (
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
              />
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              {error ? <Alert severity="error">{error}</Alert> : null}
              <Button type="submit" variant="contained" fullWidth disabled={submitting}>
                {submitting ? "Please wait…" : mode === "login" ? "Sign in with email" : "Register"}
              </Button>
            </Stack>
          </Box>
        ) : null}
        {SHOW_JWT ? (
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            sx={{ alignSelf: "flex-start" }}
          >
            {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
          </Link>
        ) : null}
      </Stack>
    </Paper>
  );
}
`;
  }

  return `"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "${authImport}/AuthProvider";
${oauthImport}
const SHOW_JWT = ${usesFrontendJwtLogin(config)};
const SHOW_OAUTH = ${showOAuth};

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{mode === "login" ? "Sign in" : "Create account"}</h1>
      ${oauthBlock}
      {${oauthDivider} ? (
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <p className="relative mx-auto w-fit bg-white px-3 text-xs uppercase tracking-wide text-slate-500">
            Or continue with email
          </p>
        </div>
      ) : null}
      {SHOW_JWT ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-md border px-3 py-2 text-sm"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? "Please wait…" : mode === "login" ? "Sign in with email" : "Register"}
          </button>
        </form>
      ) : null}
      {SHOW_JWT ? (
        <button
          type="button"
          className="text-sm text-slate-600 underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Sign in"}
        </button>
      ) : null}
    </div>
  );
}
`;
}

function requireAuthSource(config: ProjectSetupConfig, authImport: string): string {
  if (!usesTailwindStyling(config)) {
    return `"use client";

import { useEffect, type ReactNode } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useAuth } from "${authImport}/AuthProvider";

export function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  }, [loading, user, redirectTo]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <CircularProgress size={24} />
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
`;
  }

  return `"use client";

import { useEffect, type ReactNode } from "react";
import { useAuth } from "${authImport}/AuthProvider";

export function RequireAuth({
  children,
  redirectTo = "/login",
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user && typeof window !== "undefined") {
      window.location.href = redirectTo;
    }
  }, [loading, user, redirectTo]);

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
`;
}

function authPageShell(config: ProjectSetupConfig, inner: string, variant: "vite" | "next"): string {
  if (!usesTailwindStyling(config)) {
    if (variant === "next") {
      return `"use client";

import Box from "@mui/material/Box";
${inner}
`;
    }
    return `import Box from "@mui/material/Box";
${inner}
`;
  }

  if (variant === "next") {
    return `"use client";

${inner}
`;
  }
  return inner;
}

function loginPageMain(config: ProjectSetupConfig, formBody: string): string {
  if (!usesTailwindStyling(config)) {
    return `<Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      ${formBody}
    </Box>`;
  }
  return `<main className="flex min-h-svh items-center justify-center p-6">
      ${formBody}
    </main>`;
}

function frontendCwd(config: ProjectSetupConfig, root: string): string {
  return config.projectScope === "frontend_only" ? root : `${root}/frontend`;
}

function apiEnvAccess(config: ProjectSetupConfig): string {
  return config.frontendFramework === "react"
    ? "import.meta.env.VITE_API_URL"
    : "process.env.NEXT_PUBLIC_API_URL";
}

function authSharedFiles(rel: string, config: ProjectSetupConfig): FileTemplate[] {
  const apiEnv = apiEnvAccess(config);
  const defaultApi = defaultApiUrl(config);
  const isVite = config.frontendFramework === "react";
  // features/auth/* → src/lib/auth (two levels up from src/features/auth)
  const authImport = isVite ? "../../lib/auth" : "@/lib/auth";

  const files: FileTemplate[] = [
    {
      relativePath: `${rel}src/lib/auth/types.ts`,
      content: `export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
`,
    },
    {
      relativePath: `${rel}src/lib/auth/token.ts`,
      content: `const TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
`,
    },
    {
      relativePath: `${rel}src/lib/auth/api.ts`,
      content: `import type { AuthResponse, User } from "./types";
import { getToken } from "./token";

const API_URL = (${apiEnv} as string | undefined) ?? "${defaultApi}";

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: \`Bearer \${token}\` } : {};
}

export function oauthStartUrl(provider: "google" | "azure"): string {
  return \`\${API_URL}/api/auth/\${provider}\`;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(\`\${API_URL}/api/auth/login\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Login failed");
  }
  return res.json() as Promise<AuthResponse>;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(\`\${API_URL}/api/auth/register\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Registration failed");
  }
  return res.json() as Promise<AuthResponse>;
}

export async function fetchMe(): Promise<User> {
  const res = await fetch(\`\${API_URL}/api/auth/me\`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    throw new Error("Not authenticated");
  }
  const body = (await res.json()) as { user: User };
  return body.user;
}
`,
    },
    {
      relativePath: `${rel}src/lib/auth/AuthProvider.tsx`,
      content: `"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "./api";
import { clearToken, getToken, setToken } from "./token";
import type { User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  acceptToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const result = await authApi.register(email, password);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const acceptToken = useCallback(async (token: string) => {
    setToken(token);
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, acceptToken }),
    [user, loading, login, register, logout, acceptToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
`,
    },
  ];

  if (usesFrontendOAuth(config)) {
    files.push({
      relativePath: `${rel}src/features/auth/OAuthButtons.tsx`,
      content: oauthButtonsSource(config, authImport),
    });
  }

  files.push(
    {
      relativePath: `${rel}src/features/auth/LoginForm.tsx`,
      content: loginFormSource(config, authImport),
    },
    {
      relativePath: `${rel}src/features/auth/RequireAuth.tsx`,
      content: requireAuthSource(config, authImport),
    },
  );

  return files;
}

function counterImportPath(config: ProjectSetupConfig, fromVitePages = false): string {
  if (config.frontendFramework === "nextjs") {
    return "@/lib/features/counter/Counter";
  }
  return fromVitePages ? "../features/counter/Counter" : "./features/counter/Counter";
}

function authenticatedHomeSource(
  config: ProjectSetupConfig,
  variant: "vite" | "next",
): string {
  const isVite = variant === "vite";
  const authImport = isVite ? "../lib/auth/AuthProvider" : "@/lib/auth/AuthProvider";
  const requireAuthImport = isVite
    ? "../features/auth/RequireAuth"
    : "@/features/auth/RequireAuth";
  const counterImport = counterImportPath(config, isVite);
  const clientDirective = isVite ? "" : `"use client";\n\n`;
  const exportLine = isVite
    ? "export function HomePage()"
    : "export default function Home()";

  const muiImports = !usesTailwindStyling(config) ? dashboardMuiImports() : "";

  const topBarMui = `<Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {user?.email}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Signed in
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Sign out
          </Button>
        </Box>`;

  const topBarTailwind = `<div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-[180px] truncate text-sm font-medium text-slate-900">{user?.email}</p>
            <p className="text-xs text-slate-500">Signed in</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
          >
            Sign out
          </button>
        </div>`;

  const topBarJsx = usesTailwindStyling(config) ? topBarTailwind : topBarMui;

  return `${clientDirective}${muiImports}import { useAuth } from "${authImport}";
import { RequireAuth } from "${requireAuthImport}";
import { Counter } from "${counterImport}";

${exportLine} {
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      ${frontendDashboardShell(config, "<Counter />", { topBarJsx })}
    </RequireAuth>
  );
}
`;
}

function viteAuthPages(rel: string, config: ProjectSetupConfig): FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/pages/LoginPage.tsx`,
      content: authPageShell(
        config,
        `import { useNavigate } from "react-router-dom";
import { LoginForm } from "../features/auth/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();
  return (
    ${loginPageMain(config, '<LoginForm onSuccess={() => navigate("/")} />')}
  );
}
`,
        "vite",
      ),
    },
    {
      relativePath: `${rel}src/pages/AuthCallbackPage.tsx`,
      content: `import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth/AuthProvider";

export function AuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { acceptToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing token in callback URL");
      return;
    }
    void acceptToken(token)
      .then(() => navigate("/"))
      .catch(() => setError("Could not complete sign-in"));
  }, [acceptToken, navigate, params]);

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <p className="text-sm text-slate-500">Completing sign-in…</p>
    </main>
  );
}
`,
    },
    {
      relativePath: `${rel}src/pages/HomePage.tsx`,
      content: authenticatedHomeSource(config, "vite"),
    },
    {
      relativePath: `${rel}src/App.tsx`,
      writePhase: "post",
      content: `import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth/AuthProvider";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`,
    },
    {
      relativePath: `${rel}src/main.tsx`,
      writePhase: "post",
      content: buildViteMainEntry(config),
    },
  ];
}

function authCallbackPageSource(config: ProjectSetupConfig): string {
  if (!usesTailwindStyling(config)) {
    return `"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { acceptToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing token in callback URL");
      return;
    }
    void acceptToken(token)
      .then(() => router.replace("/"))
      .catch(() => setError("Could not complete sign-in"));
  }, [acceptToken, router, params]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
      }}
    >
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography color="text.secondary">Completing sign-in…</Typography>
        </Box>
      )}
    </Box>
  );
}
`;
  }

  return `"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { acceptToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing token in callback URL");
      return;
    }
    void acceptToken(token)
      .then(() => router.replace("/"))
      .catch(() => setError("Could not complete sign-in"));
  }, [acceptToken, router, params]);

  if (error) {
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <p className="text-sm text-slate-500">Completing sign-in…</p>
    </main>
  );
}
`;
}

function nextAuthPages(rel: string, config: ProjectSetupConfig): FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/app/login/page.tsx`,
      content: authPageShell(
        config,
        `import { useRouter } from "next/navigation";
import { LoginForm } from "@/features/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  return (
    ${loginPageMain(config, '<LoginForm onSuccess={() => router.replace("/")} />')}
  );
}
`,
        "next",
      ),
    },
    {
      relativePath: `${rel}src/app/auth/callback/page.tsx`,
      content: authCallbackPageSource(config),
    },
    {
      relativePath: `${rel}src/app/page.tsx`,
      writePhase: "post",
      content: authenticatedHomeSource(config, "next"),
    },
    {
      relativePath: `${rel}src/app/AuthProviderWrapper.tsx`,
      content: `"use client";

import { AuthProvider } from "@/lib/auth/AuthProvider";

export default function AuthProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
`,
    },
    {
      relativePath: `${rel}src/app/layout.tsx`,
      writePhase: "post",
      content: buildNextLayout(config),
    },
    nextFontCssFile(rel),
  ];
}

function buildNextLayout(config: ProjectSetupConfig): string {
  return buildNextRootLayout(
    config,
    "<AuthProviderWrapper>{children}</AuthProviderWrapper>",
    'import AuthProviderWrapper from "./AuthProviderWrapper";',
  );
}

function authChecklist(config: ProjectSetupConfig): string[] {
  const items = ["Frontend auth (AuthProvider, login, OAuth callback)"];
  if (usesFrontendJwtLogin(config)) items.push("JWT login/register form");
  if (hasFrontendAuthMethod(config, "google_oauth")) items.push("Google OAuth button");
  if (hasFrontendAuthMethod(config, "azure_oauth")) items.push("Azure OAuth button");
  items.push("Authenticated home with state-management counter demo");
  return items;
}

export const authViteModule: StackModule = {
  id: "frontend-auth-vite",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) && c.frontendFramework === "react" && usesFrontendAuth(c),
  checklist: authChecklist,
  dependencies: () => ["react-router-dom"],
  files: (config) => {
    const rel = frontendRelPrefix(config);
    return [
      ...authSharedFiles(rel, config),
      ...viteAuthPages(rel, config),
      {
        relativePath: `${rel}README.md`,
        content: frontendReadmeContent(config),
      },
    ];
  },
  commands: (config, root) => [
    {
      id: "auth-router-install",
      label: "Installing react-router-dom",
      exe: "npm",
      args: installLatestArgs("react-router-dom"),
      cwd: frontendCwd(config, root),
      timeoutMs: 300_000,
      phase: "post",
    },
  ],
};

function postPhaseForNext(
  config: ProjectSetupConfig,
  files: FileTemplate[],
): FileTemplate[] {
  if (config.frontendFramework !== "nextjs") return files;
  return files.map((file) => ({ ...file, writePhase: "post" as const }));
}

export const authNextModule: StackModule = {
  id: "frontend-auth-next",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) && c.frontendFramework === "nextjs" && usesFrontendAuth(c),
  checklist: authChecklist,
  dependencies: () => [],
  files: (config) => {
    const rel = frontendRelPrefix(config);
    return postPhaseForNext(config, [
      ...authSharedFiles(rel, config),
      ...nextAuthPages(rel, config),
      {
        relativePath: `${rel}README.md`,
        content: frontendReadmeContent(config),
      },
    ]);
  },
  commands: () => [],
};
