import type { ProjectSetupConfig } from "@/lib/project-setup/types";
import {
  defaultApiUrl,
  usesBackendAuth,
} from "@/lib/project-setup/templates/shared";

export function nestSwaggerMainImports(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";\n`;
}

export function nestSwaggerMainSetup(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";

  const title = config.projectName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const server = defaultApiUrl(config).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const bearer = usesBackendAuth(config)
    ? `\n    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })`
    : "";

  return `
  const swaggerConfig = new DocumentBuilder()
    .setTitle("${title} API")
    .setDescription("Generated API documentation")
    .setVersion("1.0.0")
    .addServer("${server}")${bearer}
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api-docs", app, document);
`;
}

export function nestSwaggerStartupLog(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `\n  console.log(\`API docs: http://localhost:\${process.env.PORT ?? 4000}/api-docs\`);`;
}

export function nestSwaggerHealthImports(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `import { ApiOkResponse, ApiTags } from "@nestjs/swagger";\n`;
}

export function nestSwaggerHealthClassDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `@ApiTags("Health")\n`;
}

export function nestSwaggerHealthMethodDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiOkResponse({ description: "Service is healthy" })\n`;
}

export function nestSwaggerUsersImports(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  if (usesBackendAuth(config)) {
    return `import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";\n`;
  }
  return `import { ApiOkResponse, ApiParam, ApiTags } from "@nestjs/swagger";\n`;
}

export function nestSwaggerUsersClassDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  const bearer = usesBackendAuth(config) ? `@ApiBearerAuth()\n` : "";
  return `${bearer}@ApiTags("Users")\n`;
}

export function nestSwaggerUsersListDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiOkResponse({ description: "List of users" })\n`;
}

export function nestSwaggerUsersGetDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiParam({ name: "id", type: String })
  @ApiOkResponse({ description: "User found" })
`;
}

export function nestSwaggerAuthImports(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";\n`;
}

export function nestSwaggerAuthClassDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `@ApiTags("Auth")\n`;
}

export function nestSwaggerRegisterDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ description: "User registered" })
`;
}

export function nestSwaggerLoginDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: "Authenticated" })
`;
}

export function nestSwaggerMeDecorator(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiBearerAuth()
  @ApiOkResponse({ description: "Current user" })
`;
}

export function nestSwaggerOAuthStartDecorator(
  config: ProjectSetupConfig,
  provider: "Google" | "Azure",
): string {
  if (!config.swagger) return "";
  return `  @ApiOperation({ summary: "Start ${provider} OAuth flow" })
`;
}

export function nestSwaggerOAuthCallbackDecorator(
  config: ProjectSetupConfig,
  provider: "Google" | "Azure",
): string {
  if (!config.swagger) return "";
  return `  @ApiOperation({ summary: "${provider} OAuth callback" })
  @ApiQuery({ name: "code", required: true, type: String })
`;
}

export function nestSwaggerDtoImport(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `import { ApiProperty } from "@nestjs/swagger";\n\n`;
}

export function nestSwaggerEmailProperty(config: ProjectSetupConfig): string {
  if (!config.swagger) return "";
  return `  @ApiProperty({ example: "user@example.com" })\n`;
}

export function nestSwaggerPasswordProperty(
  config: ProjectSetupConfig,
  minLength?: number,
): string {
  if (!config.swagger) return "";
  const min = minLength ? `, minLength: ${minLength}` : "";
  return `  @ApiProperty({ example: "password123"${min} })\n`;
}

export function nestOAuthSwaggerDecorators(
  config: ProjectSetupConfig,
  provider: "google" | "azure",
  kind: "start" | "callback",
): string {
  if (!config.swagger) return "";
  const label = provider === "google" ? "Google" : "Azure";
  return kind === "start"
    ? nestSwaggerOAuthStartDecorator(config, label)
    : nestSwaggerOAuthCallbackDecorator(config, label);
}
