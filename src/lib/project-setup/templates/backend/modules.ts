import type { StackModule } from "@/lib/project-setup/templates/registry";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";
import { scopeIncludesBackend, slugify, usesPrismaBackend } from "@/lib/project-setup/templates/shared";

function backendDir(config: ProjectSetupConfig, root: string): string {
  return config.projectScope === "backend_only" ? root : `${root}/backend`;
}

function backendPackageJson(config: ProjectSetupConfig, slug: string) {
  const base = {
    name: `${slug}-backend`,
    version: "1.0.0",
    private: true,
    scripts: { dev: "tsx src/index.ts", start: "node dist/index.js", build: "tsc" },
    dependencies: { express: "^4.21.0", cors: "^2.8.5", dotenv: "^16.4.5" } as Record<string, string>,
    devDependencies: {
      typescript: "^5.0.0",
      tsx: "^4.19.0",
      "@types/express": "^4.17.21",
    } as Record<string, string>,
  };

  if (usesPrismaBackend(config)) {
    return {
      ...base,
      type: "module",
      engines: { node: ">=20.19.0" },
      scripts: { ...base.scripts, "db:generate": "prisma generate" },
    };
  }

  return base;
}

function backendTsconfig(config: ProjectSetupConfig) {
  if (usesPrismaBackend(config)) {
    return {
      compilerOptions: {
        target: "ES2023",
        module: "ESNext",
        moduleResolution: "bundler",
        outDir: "dist",
        rootDir: "src",
        strict: true,
        esModuleInterop: true,
      },
      include: ["src"],
    };
  }

  return {
    compilerOptions: {
      target: "ES2020",
      module: "CommonJS",
      outDir: "dist",
      rootDir: "src",
      strict: true,
      esModuleInterop: true,
    },
    include: ["src"],
  };
}

function backendIndexSource(config: ProjectSetupConfig, slug: string): string {
  const dotenvImport = usesPrismaBackend(config) ? 'import "dotenv/config";\n' : "";
  return `${dotenvImport}import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "${slug}" });
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(\`API listening on \${port}\`));
`;
}

export const expressBaseModule: StackModule = {
  id: "backend-express",
  appliesTo: (c) => scopeIncludesBackend(c) && c.backendFramework === "express",
  checklist: () => ["Express.js API server"],
  dependencies: () => ["express", "cors", "dotenv"],
  files: (config) => {
    const rel = config.projectScope === "backend_only" ? "" : "backend/";
    const slug = slugify(config.projectName);
    return [
      {
        relativePath: `${rel}src/index.ts`,
        content: backendIndexSource(config, slug),
      },
      {
        relativePath: `${rel}package.json`,
        content: JSON.stringify(backendPackageJson(config, slug), null, 2),
      },
      {
        relativePath: `${rel}tsconfig.json`,
        content: JSON.stringify(backendTsconfig(config), null, 2),
      },
    ];
  },
  // Previously: full_stack scope only created the `backend/` folder via a
  // process.platform-branched mkdir command and never ran `npm install`.
  // Two problems with that:
  //   1. process.platform reflects the SERVER's OS, not the local executor's
  //      machine — a Linux server would emit a bare `mkdir` that fails on a
  //      Windows target.
  //   2. backend dependencies were declared in package.json but never
  //      actually installed for full_stack projects.
  // Fix: drop the mkdir entirely (the file writer should create parent dirs
  // when writing backend/src/index.ts etc.) and always run npm install,
  // scoped to whichever scope-aware directory is correct.
  commands: (config, root) => {
    const cwd = backendDir(config, root);
    return [
      {
        id: "backend-install",
        label: "Installing backend dependencies",
        exe: "npm",
        args: ["install"],
        cwd,
        timeoutMs: 600_000,
        phase: "post",
      },
    ] satisfies import("@/lib/project-setup/types").CommandStep[];
  },
};

export const prismaModule: StackModule = {
  id: "backend-prisma",
  appliesTo: (c) => scopeIncludesBackend(c) && c.database === "postgresql",
  checklist: () => ["PostgreSQL with Prisma (latest)"],
  dependencies: () => ["prisma", "@prisma/client", "@prisma/adapter-pg", "pg"],
  files: (config) => {
    const rel = config.projectScope === "backend_only" ? "" : "backend/";
    return [
      {
        relativePath: `${rel}prisma/schema.prisma`,
        content: `generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
`,
      },
      {
        relativePath: `${rel}prisma.config.ts`,
        content: `import "dotenv/config";
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
`,
      },
      {
        relativePath: `${rel}src/prisma.ts`,
        content: `import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });
`,
      },
      {
        relativePath: `${rel}.gitignore`,
        content: `node_modules/
dist/
.env
src/generated/
`,
      },
    ];
  },
  commands: (config, root) => {
    const cwd = backendDir(config, root);
    return [
      {
        id: "prisma-install",
        label: "Installing Prisma",
        exe: "npm",
        args: ["install", "prisma", "--save-dev", "@prisma/client", "@prisma/adapter-pg", "pg"],
        cwd,
        timeoutMs: 300_000,
        phase: "post",
      },
      {
        id: "prisma-generate",
        label: "Generating Prisma client",
        exe: "npx",
        args: ["prisma", "generate"],
        cwd,
        timeoutMs: 120_000,
        phase: "post",
      },
    ];
  },
};

export const mongooseModule: StackModule = {
  id: "backend-mongoose",
  appliesTo: (c) => scopeIncludesBackend(c) && c.database === "mongodb",
  checklist: () => ["MongoDB with Mongoose"],
  dependencies: () => ["mongoose"],
  files: (config) => {
    const rel = config.projectScope === "backend_only" ? "" : "backend/";
    const slug = slugify(config.projectName);
    return [
      {
        relativePath: `${rel}src/db.ts`,
        content: `import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/${slug}";
  await mongoose.connect(uri);
}
`,
      },
      {
        relativePath: `${rel}src/models/User.ts`,
        content: `import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
`,
      },
    ];
  },
  commands: (config, root) => {
    const cwd = backendDir(config, root);
    return [
      {
        id: "mongoose-install",
        label: "Installing Mongoose",
        exe: "npm",
        args: ["install", "mongoose"],
        cwd,
        timeoutMs: 300_000,
      },
    ];
  },
};

export const swaggerModule: StackModule = {
  id: "backend-swagger",
  appliesTo: (c) => scopeIncludesBackend(c) && c.swagger,
  checklist: () => ["Swagger API docs"],
  // Was missing "swagger-jsdoc" here even though the install command below
  // installs it — this list should always match what actually gets
  // installed, since other code may read it to report what's set up.
  dependencies: () => ["swagger-ui-express", "swagger-jsdoc"],
  files: () => [],
  commands: (config, root) => [
    {
      id: "swagger-install",
      label: "Installing Swagger",
      exe: "npm",
      args: ["install", "swagger-ui-express", "swagger-jsdoc"],
      cwd: backendDir(config, root),
      timeoutMs: 300_000,
    },
  ],
};

export const redisModule: StackModule = {
  id: "backend-redis",
  appliesTo: (c) => scopeIncludesBackend(c) && c.redis,
  checklist: () => ["Redis client"],
  dependencies: () => ["ioredis"],
  files: () => [],
  commands: (config, root) => [
    {
      id: "redis-install",
      label: "Installing Redis client",
      exe: "npm",
      args: ["install", "ioredis"],
      cwd: backendDir(config, root),
      timeoutMs: 300_000,
    },
  ],
};

export const socketIoModule: StackModule = {
  id: "backend-socketio",
  appliesTo: (c) => scopeIncludesBackend(c) && c.socketIo,
  checklist: () => ["Socket.IO"],
  dependencies: () => ["socket.io"],
  files: () => [],
  commands: (config, root) => [
    {
      id: "socket-install",
      label: "Installing Socket.IO",
      exe: "npm",
      args: ["install", "socket.io"],
      cwd: backendDir(config, root),
      timeoutMs: 300_000,
    },
  ],
};