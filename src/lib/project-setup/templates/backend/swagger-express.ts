import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import {
  defaultApiUrl,
  hasBackendAuthMethod,
  slugify,
  usesBackendAuth,
  usesBackendJwtLogin,
} from "@/lib/project-setup/templates/shared";

function relPrefix(config: ProjectSetupConfig): string {
  return config.projectScope === "backend_only" ? "" : "backend/";
}

function esm(config: ProjectSetupConfig): string {
  return config.database === "postgresql" ? ".js" : "";
}

function jsonSchema(content: unknown, indent = 2): string {
  return JSON.stringify(content, null, indent);
}

function bearerSecurity(): unknown[] {
  return [{ bearerAuth: [] }];
}

function errorResponse(description: string): unknown {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/Error" },
      },
    },
  };
}

function buildOpenApiSpec(config: ProjectSetupConfig): Record<string, unknown> {
  const paths: Record<string, unknown> = {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    service: { type: "string", example: slugify(config.projectName) },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users",
        ...(usesBackendAuth(config) ? { security: bearerSecurity() } : {}),
        responses: {
          "200": {
            description: "User list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: {
                      type: "array",
                      items: { $ref: "#/components/schemas/PublicUser" },
                    },
                  },
                },
              },
            },
          },
          ...(usesBackendAuth(config) ? { "401": errorResponse("Unauthorized") } : {}),
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by ID",
        ...(usesBackendAuth(config) ? { security: bearerSecurity() } : {}),
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "User found",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/PublicUser" },
                  },
                },
              },
            },
          },
          "404": errorResponse("User not found"),
          ...(usesBackendAuth(config) ? { "401": errorResponse("Unauthorized") } : {}),
        },
      },
    },
  };

  if (usesBackendJwtLogin(config)) {
    paths["/api/auth/register"] = {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "User registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "409": errorResponse("Email already registered"),
        },
      },
    };

    paths["/api/auth/login"] = {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "Authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": errorResponse("Invalid email or password"),
        },
      },
    };
  }

  if (usesBackendAuth(config)) {
    paths["/api/auth/me"] = {
      get: {
        tags: ["Auth"],
        summary: "Get the current authenticated user",
        security: bearerSecurity(),
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/PublicUser" },
                  },
                },
              },
            },
          },
          "401": errorResponse("Unauthorized"),
        },
      },
    };
  }

  if (hasBackendAuthMethod(config, "google_oauth")) {
    paths["/api/auth/google"] = {
      get: {
        tags: ["Auth"],
        summary: "Start Google OAuth flow",
        description: "Redirects the browser to Google's authorization page.",
        responses: {
          "302": { description: "Redirect to Google" },
        },
      },
    };
    paths["/api/auth/google/callback"] = {
      get: {
        tags: ["Auth"],
        summary: "Google OAuth callback",
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "302": { description: "Redirect to frontend with JWT" },
        },
      },
    };
  }

  if (hasBackendAuthMethod(config, "azure_oauth")) {
    paths["/api/auth/azure"] = {
      get: {
        tags: ["Auth"],
        summary: "Start Azure OAuth flow",
        description: "Redirects the browser to Microsoft's authorization page.",
        responses: {
          "302": { description: "Redirect to Microsoft login" },
        },
      },
    };
    paths["/api/auth/azure/callback"] = {
      get: {
        tags: ["Auth"],
        summary: "Azure OAuth callback",
        parameters: [
          {
            name: "code",
            in: "query",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "302": { description: "Redirect to frontend with JWT" },
        },
      },
    };
  }

  const components: Record<string, unknown> = {
    schemas: {
      PublicUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  };

  if (usesBackendJwtLogin(config)) {
    (components.schemas as Record<string, unknown>).RegisterRequest = {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password", minLength: 8 },
      },
    };
    (components.schemas as Record<string, unknown>).LoginRequest = {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", format: "password" },
      },
    };
    (components.schemas as Record<string, unknown>).AuthResponse = {
      type: "object",
      properties: {
        user: { $ref: "#/components/schemas/PublicUser" },
        token: { type: "string" },
      },
    };
  }

  if (usesBackendAuth(config)) {
    (components as Record<string, unknown>).securitySchemes = {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    };
  }

  return {
    openapi: "3.0.0",
    info: {
      title: `${config.projectName} API`,
      version: "1.0.0",
      description: "Generated API documentation",
    },
    servers: [{ url: defaultApiUrl(config) }],
    paths,
    components,
  };
}

function swaggerConfigSource(config: ProjectSetupConfig): string {
  const spec = jsonSchema(buildOpenApiSpec(config), 2);

  return `import type { Express } from "express";
import swaggerUi from "swagger-ui-express";

export const openApiSpec = ${spec} as const;

export function setupSwagger(app: Express) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
}
`;
}

export function swaggerExpressFiles(config: ProjectSetupConfig): FileTemplate[] {
  const rel = relPrefix(config);

  return [
    {
      relativePath: `${rel}src/config/swagger.ts`,
      content: swaggerConfigSource(config),
    },
    {
      relativePath: `${rel}src/types/swagger-ui-express.d.ts`,
      content: `declare module "swagger-ui-express" {
  import type { RequestHandler } from "express";

  interface SwaggerUiOptions {
    customCss?: string;
    customSiteTitle?: string;
  }

  export function setup(
    swaggerDoc?: Record<string, unknown>,
    opts?: SwaggerUiOptions,
    options?: Record<string, unknown>,
    customCss?: string,
    customfavIcon?: string,
    swaggerUrl?: string,
    customSiteTitle?: string,
  ): RequestHandler;

  export const serve: RequestHandler[];
  export const serveWithOptions: (options: Record<string, unknown>) => RequestHandler[];
  export function generateHTML(
    swaggerDoc?: Record<string, unknown>,
    opts?: SwaggerUiOptions,
  ): string;
}
`,
    },
  ];
}

export function swaggerAppImport(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  const e = esm(config);
  return `import { setupSwagger } from "./config/swagger${e}";\n`;
}

export function swaggerAppSetup(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return "\n  setupSwagger(app);";
}

export function swaggerServerLog(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `\n    console.log(\`API docs: http://localhost:\${port}/api-docs\`);`;
}
