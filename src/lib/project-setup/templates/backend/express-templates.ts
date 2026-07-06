import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { latestDeps } from "@/lib/project-setup/templates/package-latest";
import { expressPrismaDbSource } from "@/lib/project-setup/templates/backend/prisma-shared";
import {
  expressOAuthFiles,
  expressOAuthRouteImports,
  expressOAuthRouteLines,
} from "@/lib/project-setup/templates/backend/oauth-express";
import {
  needsJwtSigning,
  slugify,
  usesAnyAuth,
  usesJwtLogin,
  usesOAuth,
  usesPrismaBackend,
} from "@/lib/project-setup/templates/shared";
import {
  swaggerAppImport,
  swaggerAppSetup,
  swaggerServerLog,
} from "@/lib/project-setup/templates/backend/swagger-express";

function relPrefix(config: ProjectSetupConfig): string {
  return config.projectScope === "backend_only" ? "" : "backend/";
}

function esm(config: ProjectSetupConfig): string {
  return usesPrismaBackend(config) ? ".js" : "";
}

function usesJwt(config: ProjectSetupConfig): boolean {
  return usesAnyAuth(config);
}

function usesMongo(config: ProjectSetupConfig): boolean {
  return config.database === "mongodb";
}

export function expressPackageJson(config: ProjectSetupConfig, slug: string) {
  const deps = latestDeps("express", "cors", "dotenv");
  const devDeps = latestDeps(
    "typescript",
    "tsx",
    "@types/express",
    "@types/cors",
    "@types/node",
  );

  if (needsJwtSigning(config)) {
    Object.assign(deps, latestDeps("jsonwebtoken", "bcryptjs"));
    Object.assign(devDeps, latestDeps("@types/jsonwebtoken"));
  }

  if (usesMongo(config)) {
    Object.assign(deps, latestDeps("mongoose"));
  }

  if (usesPrismaBackend(config)) {
    Object.assign(deps, latestDeps("@prisma/client", "@prisma/adapter-pg", "pg"));
    Object.assign(devDeps, latestDeps("prisma"));
  }

  if (config.swagger) {
    Object.assign(deps, latestDeps("swagger-ui-express"));
  }

  const base = {
    name: `${slug}-backend`,
    version: "1.0.0",
    private: true,
    scripts: {
      dev: "tsx src/server.ts",
      start: "node dist/server.js",
      build: "tsc",
    },
    dependencies: deps,
    devDependencies: devDeps,
  };

  if (usesPrismaBackend(config)) {
    return {
      ...base,
      scripts: { ...base.scripts, postinstall: "prisma generate" },
      type: "module",
      engines: { node: ">=20.19.0" },
    };
  }

  return base;
}

export function expressTsconfig(config: ProjectSetupConfig) {
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
        skipLibCheck: true,
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
      skipLibCheck: true,
    },
    include: ["src"],
  };
}

function appSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import express from "express";
import cors from "cors";
import routes from "./routes/index${e}";
import { errorMiddleware } from "./middlewares/error.middleware${e}";
${swaggerAppImport(config)}
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());${swaggerAppSetup(config)}
  app.use("/api", routes);
  app.use(errorMiddleware);

  return app;
}
`;
}

function serverSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  const dotenv = usesPrismaBackend(config) || usesMongo(config) ? 'import "dotenv/config";\n' : "";

  if (usesPrismaBackend(config)) {
    return `${dotenv}import { createApp } from "./app${e}";
import "./config/db${e}";

async function bootstrap() {
  const app = createApp();
  const port = Number(process.env.PORT ?? 4000);

  app.listen(port, () => {
    console.log(\`API listening on \${port}\`);${swaggerServerLog(config)}
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
`;
  }

  return `${dotenv}import { createApp } from "./app${e}";
import { connectDb } from "./config/db${e}";

async function bootstrap() {
  await connectDb();

  const app = createApp();
  const port = Number(process.env.PORT ?? 4000);

  app.listen(port, () => {
    console.log(\`API listening on \${port}\`);${swaggerServerLog(config)}
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
`;
}

function dbSource(config: ProjectSetupConfig, slug: string): string {
  if (usesPrismaBackend(config)) {
    return expressPrismaDbSource();
  }

  return `import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/${slug}";
  await mongoose.connect(uri);
}
`;
}

function typesIndexSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  const exports: string[] = [`export * from "./user.types${e}";`];

  if (needsJwtSigning(config)) {
    exports.push(`export * from "./auth.types${e}";`);
  }

  return `${exports.join("\n")}\n`;
}

function userTypesSource(): string {
  return `export interface UserRecord {
  id: string;
  email: string;
  createdAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
}
`;
}

function authTypesSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import type { PublicUser } from "./user.types${e}";

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
`;
}

function appErrorSource(): string {
  return `export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
`;
}

function jwtUtilSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types/auth.types${e}";

const secret = process.env.JWT_SECRET;
if (!secret) {
  throw new Error("JWT_SECRET is not set");
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}
`;
}

function errorMiddlewareSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  const prismaImport = usesPrismaBackend(config)
    ? `import { Prisma } from "@prisma/client";\n`
    : "";
  const prismaHandler = usesPrismaBackend(config)
    ? `
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Resource already exists" });
    }
    console.error(err);
    return res.status(400).json({ message: err.message });
  }
`
    : "";

  return `import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error${e}";
${prismaImport}
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }
${prismaHandler}
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
}
`;
}

function authMiddlewareSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/app-error${e}";
import { verifyToken } from "../utils/jwt.util${e}";

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing or invalid authorization header"));
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token"));
  }
}
`;
}

function userServiceSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  const oauthFnsPrisma = usesOAuth(config)
    ? `
export async function findOrCreateOAuthUser(
  email: string,
  provider: "google" | "azure",
  providerId: string,
): Promise<PublicUser> {
  const existing = await findUserByEmail(email);
  if (existing) {
    return { id: existing.id, email: existing.email };
  }
  return createOAuthUser(email, provider, providerId);
}
`
    : "";

  const oauthFnsMongo = usesOAuth(config)
    ? `
export async function findOrCreateOAuthUser(
  email: string,
  provider: "google" | "azure",
  providerId: string,
): Promise<PublicUser> {
  const existing = await findUserByEmail(email);
  if (existing) {
    return { id: String((existing as { _id: unknown })._id), email: existing.email };
  }
  return createOAuthUser(email, provider, providerId);
}
`
    : "";

  if (usesPrismaBackend(config)) {
    const oauthCreate = usesOAuth(config)
      ? `
export async function createOAuthUser(
  email: string,
  provider: "google" | "azure",
  providerId: string,
): Promise<PublicUser> {
  const data =
    provider === "google"
      ? { email, googleId: providerId }
      : { email, azureOid: providerId };
  return prisma.user.create({
    data,
    select: { id: true, email: true },
  });
}
`
      : "";

    return `import prisma from "../config/db${e}";
import type { PublicUser } from "../types/user.types${e}";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
}

export async function createUser(email: string, passwordHash: string): Promise<PublicUser> {
  return prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true },
  });
}

export async function listUsers(): Promise<PublicUser[]> {
  return prisma.user.findMany({
    select: { id: true, email: true },
    orderBy: { createdAt: "desc" },
  });
}
${oauthCreate}${oauthFnsPrisma}`;
  }

  const oauthMongo = usesOAuth(config)
    ? `
export async function createOAuthUser(
  email: string,
  provider: "google" | "azure",
  providerId: string,
): Promise<PublicUser> {
  const data =
    provider === "google"
      ? { email, googleId: providerId }
      : { email, azureOid: providerId };
  const user = await User.create(data);
  return { id: String(user._id), email: user.email };
}
`
    : "";

  const mongoSchema = usesOAuth(config)
    ? `const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    azureOid: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);`
    : `const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);`;

  return `import mongoose from "mongoose";
import type { PublicUser } from "../types/user.types${e}";

${mongoSchema}

const User = mongoose.models.User ?? mongoose.model("User", userSchema);

export async function findUserByEmail(email: string) {
  return User.findOne({ email }).lean();
}

export async function findUserById(id: string): Promise<PublicUser | null> {
  const user = await User.findById(id).select("email").lean();
  if (!user) return null;
  return { id: String(user._id), email: user.email };
}

export async function createUser(email: string, passwordHash: string): Promise<PublicUser> {
  const user = await User.create({ email, passwordHash });
  return { id: String(user._id), email: user.email };
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await User.find().select("email").sort({ createdAt: -1 }).lean();
  return users.map((user) => ({ id: String(user._id), email: user.email }));
}
${oauthMongo}${oauthFnsMongo}`;
}

function authServiceSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import bcrypt from "bcryptjs";
import { AppError } from "../utils/app-error${e}";
import { signToken } from "../utils/jwt.util${e}";
import type { AuthResponse } from "../types/auth.types${e}";
import * as userService from "./user.service${e}";

export async function register(email: string, password: string): Promise<AuthResponse> {
  const existing = await userService.findUserByEmail(email);
  if (existing) {
    throw new AppError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userService.createUser(email, passwordHash);
  const token = signToken({ sub: user.id, email: user.email });

  return { user, token };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await userService.findUserByEmail(email);
  if (!user?.passwordHash) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const publicUser = { id: user.id, email: user.email };
  const token = signToken({ sub: user.id, email: user.email });

  return { user: publicUser, token };
}
`;
}

function authControllerSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service${e}";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.register(email, password);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const result = await authService.login(email, password);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
}
`;
}

function userControllerSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  return `import type { Request, Response, NextFunction } from "express";
import * as userService from "../services/user.service${e}";

export async function listUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await userService.listUsers();
    return res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ user });
  } catch (error) {
    next(error);
  }
}
`;
}

function healthControllerSource(slug: string): string {
  return `import type { Request, Response } from "express";

export function getHealth(_req: Request, res: Response) {
  res.json({ ok: true, service: "${slug}" });
}
`;
}

function authRoutesSource(config: ProjectSetupConfig): string {
  const e = esm(config);
  const jwtRoutes = usesJwtLogin(config)
    ? `router.post("/register", authController.register);
router.post("/login", authController.login);
`
    : "";
  const oauthRoutes = expressOAuthRouteLines(config, e).join("\n");
  const oauthImport = expressOAuthRouteImports(config, e);

  return `import { Router } from "express";
import * as authController from "../controllers/auth.controller${e}";
import { authMiddleware } from "../middlewares/auth.middleware${e}";
${oauthImport}
const router = Router();

${jwtRoutes}router.get("/me", authMiddleware, authController.me);
${oauthRoutes ? `\n${oauthRoutes}` : ""}

export default router;
`;
}

function userRoutesSource(config: ProjectSetupConfig): string {
  const e = esm(config);

  return `import { Router } from "express";
import * as userController from "../controllers/user.controller${e}";
${usesJwt(config) ? `import { authMiddleware } from "../middlewares/auth.middleware${e}";\n` : ""}
const router = Router();
${usesJwt(config) ? "\nrouter.use(authMiddleware);\n" : ""}
router.get("/", userController.listUsers);
router.get("/:id", userController.getUser);

export default router;
`;
}

function routesIndexSource(config: ProjectSetupConfig, slug: string): string {
  const e = esm(config);
  const imports: string[] = [
    `import { Router } from "express";`,
    `import * as healthController from "../controllers/health.controller${e}";`,
  ];
  const mounts: string[] = [`router.get("/health", healthController.getHealth);`];

  if (usesJwt(config)) {
    imports.push(`import authRoutes from "./auth.routes${e}";`);
    mounts.push(`router.use("/auth", authRoutes);`);
  }

  imports.push(`import userRoutes from "./user.routes${e}";`);
  mounts.push(`router.use("/users", userRoutes);`);

  return `${imports.join("\n")}

const router = Router();

${mounts.join("\n")}

export default router;
`;
}

export function expressLayeredFiles(config: ProjectSetupConfig): FileTemplate[] {
  const rel = relPrefix(config);
  const slug = slugify(config.projectName);
  const e = esm(config);
  const files: FileTemplate[] = [
    { relativePath: `${rel}src/app.ts`, content: appSource(config) },
    { relativePath: `${rel}src/server.ts`, content: serverSource(config) },
    { relativePath: `${rel}src/config/db.ts`, content: dbSource(config, slug) },
    { relativePath: `${rel}src/utils/app-error.ts`, content: appErrorSource() },
    {
      relativePath: `${rel}src/middlewares/error.middleware.ts`,
      content: errorMiddlewareSource(config),
    },
    {
      relativePath: `${rel}src/controllers/health.controller.ts`,
      content: healthControllerSource(slug),
    },
    { relativePath: `${rel}src/types/user.types.ts`, content: userTypesSource() },
    { relativePath: `${rel}src/types/index.ts`, content: typesIndexSource(config) },
    {
      relativePath: `${rel}src/services/user.service.ts`,
      content: userServiceSource(config),
    },
    {
      relativePath: `${rel}src/controllers/user.controller.ts`,
      content: userControllerSource(config),
    },
    { relativePath: `${rel}src/routes/user.routes.ts`, content: userRoutesSource(config) },
    {
      relativePath: `${rel}src/routes/index.ts`,
      content: routesIndexSource(config, slug),
    },
  ];

  if (usesJwt(config)) {
    files.push(
      { relativePath: `${rel}src/types/auth.types.ts`, content: authTypesSource(config) },
      { relativePath: `${rel}src/utils/jwt.util.ts`, content: jwtUtilSource(config) },
      {
        relativePath: `${rel}src/middlewares/auth.middleware.ts`,
        content: authMiddlewareSource(config),
      },
      {
        relativePath: `${rel}src/controllers/auth.controller.ts`,
        content: authControllerSource(config),
      },
      { relativePath: `${rel}src/routes/auth.routes.ts`, content: authRoutesSource(config) },
    );

    if (usesJwtLogin(config)) {
      files.push({
        relativePath: `${rel}src/services/auth.service.ts`,
        content: authServiceSource(config),
      });
    }

    files.push(...expressOAuthFiles(config, rel, e));
  }

  return files;
}
