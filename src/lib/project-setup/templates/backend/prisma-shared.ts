import type { CommandStep } from "@/lib/project-setup/types";
import { usesOAuth } from "@/lib/project-setup/templates/shared";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";

/** Post-install step: generate Prisma Client types (no database required). */
export function prismaGenerateStep(cwd: string): CommandStep {
  return {
    id: "prisma-generate",
    label: "Generating Prisma Client",
    exe: "npx",
    args: ["prisma", "generate"],
    cwd,
    timeoutMs: 120_000,
    phase: "post",
  };
}

/** Post-install step: create initial migration and apply it (non-interactive). */
export function prismaMigrateDevStep(cwd: string, databaseUrl: string): CommandStep {
  return {
    id: "prisma-migrate",
    label: "Creating and applying initial migration",
    exe: "npx",
    args: ["prisma", "migrate", "dev", "--name", "init"],
    cwd,
    timeoutMs: 300_000,
    phase: "post",
    env: { DATABASE_URL: databaseUrl },
  };
}

/** Shared Prisma schema for generated Express and NestJS backends. */
export function prismaSchemaContent(config?: ProjectSetupConfig): string {
  const oauth = config ? usesOAuth(config) : false;
  const passwordField = oauth
    ? "  passwordHash String?"
    : "  passwordHash String";
  const oauthFields = oauth
    ? `
  googleId     String?  @unique
  azureOid     String?  @unique`
    : "";

  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
${passwordField}${oauthFields}
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
`;
}

export function prismaConfigContent(): string {
  return `import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/postgres",
  },
});
`;
}

export function prismaGitignoreContent(): string {
  return `node_modules/
dist/
.env
`;
}

/** Build pg Pool config — SSL only for remote databases, not localhost. */
function poolConfigBlock(): string {
  return `const poolConfig: PoolConfig = { connectionString };

if (!/localhost|127\\.0\\.0\\.1/.test(connectionString)) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);`;
}

/** Express ESM db module — Pool + @prisma/client (no custom generated output). */
export function expressPrismaDbSource(): string {
  return `import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

${poolConfigBlock()}

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
`;
}

/** NestJS PrismaService — Pool + @prisma/client. */
export function nestPrismaServiceSource(): string {
  return `import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    const poolConfig: PoolConfig = { connectionString };
    if (!/localhost|127\\.0\\.0\\.1/.test(connectionString)) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
`;
}
