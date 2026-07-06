import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import {
  defaultApiUrl,
  defaultFrontendUrl,
  hasAuthMethod,
  usesOAuth,
} from "@/lib/project-setup/templates/shared";

function oauthServiceNestSource(config: ProjectSetupConfig): string {
  return `import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";

@Injectable()
export class OAuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private get apiUrl() {
    return process.env.API_URL ?? "${defaultApiUrl(config)}";
  }

  private get frontendUrl() {
    return process.env.FRONTEND_URL ?? "${defaultFrontendUrl(config)}";
  }

  async handleGoogleCallback(code: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new UnauthorizedException("Google OAuth env vars are not set");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: \`\${this.apiUrl}/api/auth/google/callback\`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      throw new UnauthorizedException("Failed to exchange Google authorization code");
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      throw new UnauthorizedException("Google token response missing access_token");
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: \`Bearer \${tokens.access_token}\` },
    });

    if (!profileRes.ok) {
      throw new UnauthorizedException("Failed to fetch Google profile");
    }

    const profile = (await profileRes.json()) as { id?: string; email?: string };
    if (!profile.id || !profile.email) {
      throw new UnauthorizedException("Google profile missing id or email");
    }

    return this.issueToken(profile.email, "google", profile.id);
  }

  async handleAzureCallback(code: string) {
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantId = process.env.AZURE_TENANT_ID;
    if (!clientId || !clientSecret || !tenantId) {
      throw new UnauthorizedException("Azure OAuth env vars are not set");
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
          redirect_uri: \`\${this.apiUrl}/api/auth/azure/callback\`,
          grant_type: "authorization_code",
        }),
      },
    );

    if (!tokenRes.ok) {
      throw new UnauthorizedException("Failed to exchange Azure authorization code");
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      throw new UnauthorizedException("Azure token response missing access_token");
    }

    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: \`Bearer \${tokens.access_token}\` },
    });

    if (!profileRes.ok) {
      throw new UnauthorizedException("Failed to fetch Azure profile");
    }

    const profile = (await profileRes.json()) as {
      id?: string;
      mail?: string;
      userPrincipalName?: string;
    };
    const email = profile.mail ?? profile.userPrincipalName;
    if (!profile.id || !email) {
      throw new UnauthorizedException("Azure profile missing id or email");
    }

    return this.issueToken(email, "azure", profile.id);
  }

  redirectWithToken(token: string) {
    return \`\${this.frontendUrl}/auth/callback?token=\${encodeURIComponent(token)}\`;
  }

  googleAuthorizeUrl() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      throw new UnauthorizedException("GOOGLE_CLIENT_ID is not set");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: \`\${this.apiUrl}/api/auth/google/callback\`,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    return \`https://accounts.google.com/o/oauth2/v2/auth?\${params}\`;
  }

  azureAuthorizeUrl() {
    const clientId = process.env.AZURE_CLIENT_ID;
    const tenantId = process.env.AZURE_TENANT_ID;
    if (!clientId || !tenantId) {
      throw new UnauthorizedException("Azure OAuth env vars are not set");
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: \`\${this.apiUrl}/api/auth/azure/callback\`,
      response_type: "code",
      scope: "openid email profile User.Read",
      prompt: "select_account",
    });
    return \`https://login.microsoftonline.com/\${tenantId}/oauth2/v2.0/authorize?\${params}\`;
  }

  private async issueToken(email: string, provider: "google" | "azure", providerId: string) {
    const user = await this.usersService.findOrCreateOAuthUser(email, provider, providerId);
    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email });
    return { user, token };
  }
}
`;
}

function authControllerOAuthMethods(config: ProjectSetupConfig): string {
  const methods: string[] = [];
  if (hasAuthMethod(config, "google_oauth")) {
    methods.push(`
  @Get("google")
  googleStart(@Res() res: Response) {
    return res.redirect(this.oauthService.googleAuthorizeUrl());
  }

  @Get("google/callback")
  async googleCallback(@Query("code") code: string, @Res() res: Response) {
    const result = await this.oauthService.handleGoogleCallback(code);
    return res.redirect(this.oauthService.redirectWithToken(result.token));
  }`);
  }
  if (hasAuthMethod(config, "azure_oauth")) {
    methods.push(`
  @Get("azure")
  azureStart(@Res() res: Response) {
    return res.redirect(this.oauthService.azureAuthorizeUrl());
  }

  @Get("azure/callback")
  async azureCallback(@Query("code") code: string, @Res() res: Response) {
    const result = await this.oauthService.handleAzureCallback(code);
    return res.redirect(this.oauthService.redirectWithToken(result.token));
  }`);
  }
  return methods.join("\n");
}

export function nestOAuthExtraImports(config: ProjectSetupConfig): string {
  if (!usesOAuth(config)) return "";
  return `import { Redirect, Res } from "@nestjs/common";
import { Response } from "express";
import { OAuthService } from "./oauth.service";
`;
}

export function nestOAuthControllerInject(config: ProjectSetupConfig): string {
  if (!usesOAuth(config)) return "";
  return `, private readonly oauthService: OAuthService`;
}

export function nestOAuthControllerMethods(config: ProjectSetupConfig): string {
  return authControllerOAuthMethods(config);
}

export function nestAuthModuleOAuthProviders(config: ProjectSetupConfig): string {
  if (!usesOAuth(config)) return "";
  return `OAuthService,`;
}

export function nestOAuthFiles(config: ProjectSetupConfig, rel: string): FileTemplate[] {
  if (!usesOAuth(config)) return [];
  return [
    {
      relativePath: `${rel}src/modules/auth/oauth.service.ts`,
      content: oauthServiceNestSource(config),
    },
  ];
}
