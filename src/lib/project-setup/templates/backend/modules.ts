import type { StackModule } from "@/lib/project-setup/templates/registry";
import type { ProjectSetupConfig, CommandStep } from "@/lib/project-setup/types";
import {
  installLatestArgs,
} from "@/lib/project-setup/templates/package-latest";
import { scopeIncludesBackend, slugify, usesPrismaBackend } from "@/lib/project-setup/templates/shared";
import {
  expressLayeredFiles,
  expressPackageJson,
  expressTsconfig,
} from "@/lib/project-setup/templates/backend/express-templates";
import {
  nestCliJson,
  nestLayeredFiles,
  nestPackageJson,
  nestPrismaSchemaFiles,
  nestTsconfig,
  nestTsconfigBuild,
} from "@/lib/project-setup/templates/backend/nest-templates";
import {
  prismaConfigContent,
  prismaGenerateStep,
  prismaGitignoreContent,
  prismaMigrateDevStep,
  prismaSchemaContent,
} from "@/lib/project-setup/templates/backend/prisma-shared";

function backendDir(config: ProjectSetupConfig, root: string): string {
  return config.projectScope === "backend_only" ? root : `${root}/backend`;
}

function backendRel(config: ProjectSetupConfig): string {
  return config.projectScope === "backend_only" ? "" : "backend/";
}

function expressChecklist(config: ProjectSetupConfig): string[] {
  const items = [
    "Express layered API (routes → controllers → services → config)",
  ];
  if (config.backendAuth === "jwt") {
    items.push("JWT auth routes (/api/auth/register, /login, /me)");
  }
  if (config.database === "postgresql") {
    items.push("PostgreSQL via pg Pool + Prisma (@prisma/client) in src/config/db.ts");
  }
  if (config.database === "mongodb") {
    items.push("MongoDB connection in src/config/db.ts");
  }
  return items;
}

function nestChecklist(config: ProjectSetupConfig): string[] {
  const items = ["NestJS modular API (feature modules + shared guards/filters)"];
  if (config.backendAuth === "jwt") {
    items.push("JWT auth module (Passport + @nestjs/jwt)");
  }
  if (config.database === "postgresql") {
    items.push("PostgreSQL via Prisma module");
  }
  if (config.database === "mongodb") {
    items.push("MongoDB via @nestjs/mongoose");
  }
  return items;
}

function expressDependencies(config: ProjectSetupConfig): string[] {
  const deps = ["express", "cors", "dotenv"];
  if (config.backendAuth === "jwt") {
    deps.push("jsonwebtoken", "bcryptjs");
  }
  if (config.database === "mongodb") {
    deps.push("mongoose");
  }
  return deps;
}

export const expressBaseModule: StackModule = {
  id: "backend-express",
  appliesTo: (c) => scopeIncludesBackend(c) && c.backendFramework === "express",
  checklist: expressChecklist,
  dependencies: expressDependencies,
  files: (config) => {
    const rel = backendRel(config);
    const slug = slugify(config.projectName);
    return [
      ...expressLayeredFiles(config),
      {
        relativePath: `${rel}package.json`,
        content: JSON.stringify(expressPackageJson(config, slug), null, 2),
      },
      {
        relativePath: `${rel}tsconfig.json`,
        content: JSON.stringify(expressTsconfig(config), null, 2),
      },
    ];
  },
  commands: (config, root) => [
    {
      id: "backend-install",
      label: "Installing backend dependencies",
      exe: "npm",
      args: ["install"],
      cwd: backendDir(config, root),
      timeoutMs: 600_000,
      phase: "post",
    },
  ],
};

export const prismaModule: StackModule = {
  id: "backend-prisma",
  appliesTo: (c) =>
    scopeIncludesBackend(c) &&
    c.backendFramework === "express" &&
    c.database === "postgresql",
  checklist: (config) => {
    const items = ["Prisma schema and src/config/db.ts"];
    if (!config.databaseUrl?.trim()) {
      items.push("Initial migration skipped — provide DATABASE_URL to run migrate dev during setup");
    }
    return items;
  },
  dependencies: () => ["prisma", "@prisma/client", "@prisma/adapter-pg", "pg"],
  files: (config) => {
    const rel = backendRel(config);
    return [
      {
        relativePath: `${rel}prisma/schema.prisma`,
        content: prismaSchemaContent(),
      },
      {
        relativePath: `${rel}prisma.config.ts`,
        content: prismaConfigContent(),
      },
      {
        relativePath: `${rel}.gitignore`,
        content: prismaGitignoreContent(),
      },
    ];
  },
  commands: (config, root) => {
    const cwd = backendDir(config, root);
    const commands = [prismaGenerateStep(cwd)];
    if (config.databaseUrl?.trim()) {
      commands.push(prismaMigrateDevStep(cwd, config.databaseUrl.trim()));
    }
    return commands;
  },
};

export const mongooseModule: StackModule = {
  id: "backend-mongoose",
  appliesTo: (c) =>
    scopeIncludesBackend(c) &&
    c.backendFramework === "express" &&
    c.database === "mongodb",
  checklist: () => ["Mongoose user model in src/services/user.service.ts"],
  dependencies: () => ["mongoose"],
  files: () => [],
  commands: () => [],
};

export const swaggerModule: StackModule = {
  id: "backend-swagger",
  appliesTo: (c) => scopeIncludesBackend(c) && c.backendFramework === "express" && c.swagger,
  checklist: () => ["Swagger API docs"],
  dependencies: () => ["swagger-ui-express", "swagger-jsdoc"],
  files: () => [],
  commands: (config, root) => [
    {
      id: "swagger-install",
      label: "Installing Swagger",
      exe: "npm",
      args: installLatestArgs("swagger-ui-express", "swagger-jsdoc"),
      cwd: backendDir(config, root),
      timeoutMs: 300_000,
    },
  ],
};

export const redisModule: StackModule = {
  id: "backend-redis",
  appliesTo: (c) => scopeIncludesBackend(c) && c.backendFramework === "express" && c.redis,
  checklist: () => ["Redis client"],
  dependencies: () => ["ioredis"],
  files: () => [],
  commands: (config, root) => [
    {
      id: "redis-install",
      label: "Installing Redis client",
      exe: "npm",
      args: installLatestArgs("ioredis"),
      cwd: backendDir(config, root),
      timeoutMs: 300_000,
    },
  ],
};

export const socketIoModule: StackModule = {
  id: "backend-socketio",
  appliesTo: (c) => scopeIncludesBackend(c) && c.backendFramework === "express" && c.socketIo,
  checklist: () => ["Socket.IO"],
  dependencies: () => ["socket.io"],
  files: () => [],
  commands: (config, root) => [
    {
      id: "socket-install",
      label: "Installing Socket.IO",
      exe: "npm",
      args: installLatestArgs("socket.io"),
      cwd: backendDir(config, root),
      timeoutMs: 300_000,
    },
  ],
};

export const nestBaseModule: StackModule = {
  id: "backend-nest",
  appliesTo: (c) => scopeIncludesBackend(c) && c.backendFramework === "nestjs",
  checklist: nestChecklist,
  dependencies: (config) => {
    const deps = [
      "@nestjs/common",
      "@nestjs/core",
      "@nestjs/platform-express",
      "reflect-metadata",
      "rxjs",
    ];
    if (config.backendAuth === "jwt") {
      deps.push("@nestjs/jwt", "@nestjs/passport", "passport", "passport-jwt", "bcryptjs");
    }
    if (config.database === "mongodb") {
      deps.push("@nestjs/mongoose", "mongoose");
    }
    if (config.database === "postgresql") {
      deps.push("@prisma/client", "@prisma/adapter-pg", "pg");
    }
    return deps;
  },
  files: (config) => {
    const rel = backendRel(config);
    const slug = slugify(config.projectName);
    return [
      ...nestLayeredFiles(config),
      ...nestPrismaSchemaFiles(config),
      {
        relativePath: `${rel}package.json`,
        content: JSON.stringify(nestPackageJson(config, slug), null, 2),
      },
      {
        relativePath: `${rel}nest-cli.json`,
        content: JSON.stringify(nestCliJson(), null, 2),
      },
      {
        relativePath: `${rel}tsconfig.json`,
        content: JSON.stringify(nestTsconfig(), null, 2),
      },
      {
        relativePath: `${rel}tsconfig.build.json`,
        content: JSON.stringify(nestTsconfigBuild(), null, 2),
      },
    ];
  },
  commands: (config, root) => {
    const cwd = backendDir(config, root);
    const commands: CommandStep[] = [
      {
        id: "backend-install",
        label: "Installing backend dependencies",
        exe: "npm",
        args: ["install"],
        cwd,
        timeoutMs: 600_000,
        phase: "post" as const,
      },
    ];

    if (usesPrismaBackend(config)) {
      commands.push(prismaGenerateStep(cwd));
      if (config.databaseUrl?.trim()) {
        commands.push(prismaMigrateDevStep(cwd, config.databaseUrl.trim()));
      }
    }

    return commands;
  },
};
