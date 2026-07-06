import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import {
  defaultApiUrl,
  defaultFrontendUrl,
  hasAuthMethod,
  usesOAuth,
} from "@/lib/project-setup/templates/shared";

export function expressOAuthDependencies(config: ProjectSetupConfig): string[] {
  if (!usesOAuth(config)) return [];
  return [];
}

function oauthControllerSource(config: ProjectSetupConfig, e: string): string {
  const googleStart = hasAuthMethod(config, "google_oauth")
    ? `
export function googleStart(_req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const apiUrl = process.env.API_URL ?? "${defaultApiUrl(config)}";
    if (!clientId) {
      throw new AppError(500, "GOOGLE_CLIENT_ID is not set");
    }
    const redirectUri = \`\${apiUrl}/api/auth/google/callback\`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    res.redirect(\`https://accounts.google.com/o/oauth2/v2/auth?\${params}\`);
  } catch (error) {
    next(error);
  }
}

export async function googleCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      throw new AppError(400, "Missing authorization code");
    }
    const result = await oauthService.handleGoogleCallback(code);
    const frontendUrl = process.env.FRONTEND_URL ?? "${defaultFrontendUrl(config)}";
    res.redirect(\`\${frontendUrl}/auth/callback?token=\${encodeURIComponent(result.token)}\`);
  } catch (error) {
    next(error);
  }
}
`
    : "";

  const azureStart = hasAuthMethod(config, "azure_oauth")
    ? `
export function azureStart(_req: Request, res: Response, next: NextFunction) {
  try {
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    const apiUrl = process.env.API_URL ?? "${defaultApiUrl(config)}";
    if (!clientId || !tenantId) {
      throw new AppError(500, "Azure OAuth env vars are not set");
    }
    const redirectUri = \`\${apiUrl}/api/auth/azure/callback\`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile User.Read",
      prompt: "select_account",
    });
    res.redirect(
      \`https://login.microsoftonline.com/\${tenantId}/oauth2/v2.0/authorize?\${params}\`,
    );
  } catch (error) {
    next(error);
  }
}

export async function azureCallback(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.query.code as string | undefined;
    if (!code) {
      throw new AppError(400, "Missing authorization code");
    }
    const result = await oauthService.handleAzureCallback(code);
    const frontendUrl = process.env.FRONTEND_URL ?? "${defaultFrontendUrl(config)}";
    res.redirect(\`\${frontendUrl}/auth/callback?token=\${encodeURIComponent(result.token)}\`);
  } catch (error) {
    next(error);
  }
}
`
    : "";

  return `import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/app-error${e}";
import * as oauthService from "../services/oauth.service${e}";
${googleStart}${azureStart}`;
}

function oauthServiceSource(config: ProjectSetupConfig, e: string): string {
  return `import { AppError } from "../utils/app-error${e}";
import { signToken } from "../utils/jwt.util${e}";
import * as userService from "./user.service${e}";
import { defaultApiUrl, defaultFrontendUrl } from "../config/auth.config${e}";

async function exchangeGoogleCode(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const apiUrl = process.env.API_URL ?? defaultApiUrl;
  if (!clientId || !clientSecret) {
    throw new AppError(500, "Google OAuth env vars are not set");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: \`\${apiUrl}/api/auth/google/callback\`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    throw new AppError(401, "Failed to exchange Google authorization code");
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new AppError(401, "Google token response missing access_token");
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: \`Bearer \${tokens.access_token}\` },
  });

  if (!profileRes.ok) {
    throw new AppError(401, "Failed to fetch Google profile");
  }

  const profile = (await profileRes.json()) as { id?: string; email?: string };
  if (!profile.id || !profile.email) {
    throw new AppError(401, "Google profile missing id or email");
  }

  return { providerId: profile.id, email: profile.email, provider: "google" as const };
}

async function exchangeAzureCode(code: string) {
  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;
  const apiUrl = process.env.API_URL ?? defaultApiUrl;
  if (!clientId || !clientSecret || !tenantId) {
    throw new AppError(500, "Azure OAuth env vars are not set");
  }

  const tokenRes = await fetch(
    \`https://login.microsoftonline.com/\${tenantId}/oauth2/v2.0/token\`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: \`\${apiUrl}/api/auth/azure/callback\`,
        grant_type: "authorization_code",
      }),
    },
  );

  if (!tokenRes.ok) {
    throw new AppError(401, "Failed to exchange Azure authorization code");
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new AppError(401, "Azure token response missing access_token");
  }

  const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: \`Bearer \${tokens.access_token}\` },
  });

  if (!profileRes.ok) {
    throw new AppError(401, "Failed to fetch Azure profile");
  }

  const profile = (await profileRes.json()) as { id?: string; mail?: string; userPrincipalName?: string };
  const email = profile.mail ?? profile.userPrincipalName;
  if (!profile.id || !email) {
    throw new AppError(401, "Azure profile missing id or email");
  }

  return { providerId: profile.id, email, provider: "azure" as const };
}

export async function handleGoogleCallback(code: string) {
  const profile = await exchangeGoogleCode(code);
  const user = await userService.findOrCreateOAuthUser(profile.email, profile.provider, profile.providerId);
  const token = signToken({ sub: user.id, email: user.email });
  void defaultFrontendUrl;
  return { user, token };
}

export async function handleAzureCallback(code: string) {
  const profile = await exchangeAzureCode(code);
  const user = await userService.findOrCreateOAuthUser(profile.email, profile.provider, profile.providerId);
  const token = signToken({ sub: user.id, email: user.email });
  return { user, token };
}
`;
}

function authConfigSource(config: ProjectSetupConfig, e: string): string {
  return `export const defaultApiUrl = "${defaultApiUrl(config)}";
export const defaultFrontendUrl = "${defaultFrontendUrl(config)}";
`;
}

export function expressOAuthFiles(
  config: ProjectSetupConfig,
  rel: string,
  e: string,
): FileTemplate[] {
  if (!usesOAuth(config)) return [];

  return [
    {
      relativePath: `${rel}src/config/auth.config.ts`,
      content: authConfigSource(config, e),
    },
    {
      relativePath: `${rel}src/services/oauth.service.ts`,
      content: oauthServiceSource(config, e),
    },
    {
      relativePath: `${rel}src/controllers/oauth.controller.ts`,
      content: oauthControllerSource(config, e),
    },
  ];
}

export function expressOAuthRouteLines(config: ProjectSetupConfig, e: string): string[] {
  const lines: string[] = [];
  if (hasAuthMethod(config, "google_oauth")) {
    lines.push(
      `router.get("/google", oauthController.googleStart);`,
      `router.get("/google/callback", oauthController.googleCallback);`,
    );
  }
  if (hasAuthMethod(config, "azure_oauth")) {
    lines.push(
      `router.get("/azure", oauthController.azureStart);`,
      `router.get("/azure/callback", oauthController.azureCallback);`,
    );
  }
  return lines;
}

export function expressOAuthRouteImports(config: ProjectSetupConfig, e: string): string {
  if (!usesOAuth(config)) return "";
  return `import * as oauthController from "../controllers/oauth.controller${e}";\n`;
}
