import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { latestDeps } from "@/lib/project-setup/templates/package-latest";
import {
  nestPrismaServiceSource,
  prismaConfigContent,
  prismaGitignoreContent,
  prismaSchemaContent,
} from "@/lib/project-setup/templates/backend/prisma-shared";
import { slugify, usesPrismaBackend } from "@/lib/project-setup/templates/shared";

function relPrefix(config: ProjectSetupConfig): string {
  return config.projectScope === "backend_only" ? "" : "backend/";
}

function usesJwt(config: ProjectSetupConfig): boolean {
  return config.backendAuth === "jwt";
}

function usesMongo(config: ProjectSetupConfig): boolean {
  return config.database === "mongodb";
}

export function nestPackageJson(config: ProjectSetupConfig, slug: string) {
  const deps = latestDeps(
    "@nestjs/common",
    "@nestjs/core",
    "@nestjs/platform-express",
    "reflect-metadata",
    "rxjs",
  );
  const devDeps = latestDeps(
    "@nestjs/cli",
    "@nestjs/schematics",
    "@types/node",
    "typescript",
  );

  if (usesJwt(config)) {
    Object.assign(
      deps,
      latestDeps(
        "@nestjs/jwt",
        "@nestjs/passport",
        "passport",
        "passport-jwt",
        "bcryptjs",
      ),
    );
    Object.assign(devDeps, latestDeps("@types/passport-jwt"));
  }

  if (usesMongo(config)) {
    Object.assign(deps, latestDeps("@nestjs/mongoose", "mongoose"));
  }

  if (usesPrismaBackend(config)) {
    Object.assign(deps, latestDeps("@prisma/client", "@prisma/adapter-pg", "pg", "dotenv"));
    Object.assign(devDeps, latestDeps("prisma"));
  }

  const base = {
    name: `${slug}-backend`,
    version: "1.0.0",
    private: true,
    scripts: {
      build: "nest build",
      start: "nest start",
      "start:dev": "nest start --watch",
      "start:prod": "node dist/main",
    },
    dependencies: deps,
    devDependencies: devDeps,
  };

  if (usesPrismaBackend(config)) {
    return {
      ...base,
      scripts: { ...base.scripts, postinstall: "prisma generate" },
      engines: { node: ">=20.19.0" },
    };
  }

  return base;
}

export function nestTsconfig() {
  return {
    compilerOptions: {
      module: "commonjs",
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: "ES2021",
      sourceMap: true,
      outDir: "./dist",
      baseUrl: "./",
      incremental: true,
      skipLibCheck: true,
      strictNullChecks: true,
      noImplicitAny: true,
      strictBindCallApply: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
    },
  };
}

export function nestTsconfigBuild() {
  return {
    extends: "./tsconfig.json",
    exclude: ["node_modules", "dist", "test", "**/*spec.ts"],
  };
}

export function nestCliJson() {
  return {
    $schema: "https://json.schemastore.org/nest-cli",
    collection: "@nestjs/schematics",
    sourceRoot: "src",
    compilerOptions: {
      deleteOutDir: true,
    },
  };
}

function mainSource(): string {
  return `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 4000);
}

bootstrap();
`;
}

function appModuleSource(config: ProjectSetupConfig): string {
  const imports: string[] = [];
  const moduleImports: string[] = [`import { Module } from "@nestjs/common";`];

  if (usesMongo(config)) {
    moduleImports.push(`import { MongooseModule } from "@nestjs/mongoose";`);
    imports.push(
      `MongooseModule.forRoot(process.env.MONGODB_URI ?? "mongodb://localhost:27017/${slugify(config.projectName)}")`,
    );
  }

  if (usesPrismaBackend(config)) {
    moduleImports.push(`import { PrismaModule } from "./prisma/prisma.module";`);
    imports.push("PrismaModule");
  }

  moduleImports.push(`import { HealthModule } from "./modules/health/health.module";`);
  moduleImports.push(`import { UsersModule } from "./modules/users/users.module";`);
  imports.push("HealthModule", "UsersModule");

  if (usesJwt(config)) {
    moduleImports.push(`import { AuthModule } from "./modules/auth/auth.module";`);
    imports.unshift("AuthModule");
  }

  return `${moduleImports.join("\n")}

@Module({
  imports: [
    ${imports.join(",\n    ")},
  ],
})
export class AppModule {}
`;
}

function httpExceptionFilterSource(): string {
  return `import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : typeof body === "object" && body && "message" in body
            ? (body as { message: string | string[] }).message
            : exception.message;

      return response.status(status).json({
        message: Array.isArray(message) ? message[0] : message,
      });
    }

    console.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: "Internal server error",
    });
  }
}
`;
}

function healthModuleSource(): string {
  return `import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
`;
}

function healthControllerSource(): string {
  return `import { Controller, Get } from "@nestjs/common";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth() {
    return this.healthService.getHealth();
  }
}
`;
}

function healthServiceSource(slug: string): string {
  return `import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthService {
  getHealth() {
    return { ok: true, service: "${slug}" };
  }
}
`;
}

function prismaModuleSource(): string {
  return `import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;
}

function prismaServiceSource(): string {
  return nestPrismaServiceSource();
}

function usersModuleSource(): string {
  return `import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`;
}

function usersControllerSource(config: ProjectSetupConfig): string {
  const guard = usesJwt(config)
    ? `@UseGuards(JwtAuthGuard)\n`
    : "";
  const guardImport = usesJwt(config)
    ? `import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";\n`
    : "";

  return `import { Controller, Get, Param${usesJwt(config) ? ", UseGuards" : ""} } from "@nestjs/common";
${guardImport}import { UsersService } from "./users.service";

@Controller("users")
${guard}export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get(":id")
  getUser(@Param("id") id: string) {
    return this.usersService.findById(id);
  }
}
`;
}

function usersServicePrismaSource(): string {
  return `import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException("User not found");
    return { user };
  }

  createUser(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
  }

  listUsers() {
    return this.prisma.user.findMany({
      select: { id: true, email: true },
      orderBy: { createdAt: "desc" },
    });
  }
}
`;
}

function usersServiceMongoSource(): string {
  return `import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select("email").lean();
    if (!user) throw new NotFoundException("User not found");
    return { user: { id: String(user._id), email: user.email } };
  }

  async createUser(email: string, passwordHash: string) {
    const user = await this.userModel.create({ email, passwordHash });
    return { id: String(user._id), email: user.email };
  }

  async listUsers() {
    const users = await this.userModel.find().select("email").sort({ createdAt: -1 }).lean();
    return users.map((user) => ({ id: String(user._id), email: user.email }));
  }
}
`;
}

function userSchemaMongoSource(): string {
  return `import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
`;
}

function usersModuleMongoSource(): string {
  return `import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { User, UserSchema } from "./schemas/user.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
`;
}

function authModuleSource(): string {
  return `import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
`;
}

function authControllerSource(): string {
  return `import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password);
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@Req() req: { user: { id: string; email: string } }) {
    return { user: req.user };
  }
}
`;
}

function authServiceSource(): string {
  return `import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(email, passwordHash);
    const token = await this.signToken(user.id, user.email);

    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const publicUser = { id: user.id, email: user.email };
    const token = await this.signToken(user.id, user.email);

    return { user: publicUser, token };
  }

  private signToken(sub: string, email: string) {
    return this.jwtService.signAsync({ sub, email });
  }
}
`;
}

function jwtStrategySource(): string {
  return `import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
`;
}

function jwtAuthGuardSource(): string {
  return `import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
`;
}

function loginDtoSource(): string {
  return `export class LoginDto {
  email!: string;
  password!: string;
}
`;
}

function registerDtoSource(): string {
  return `export class RegisterDto {
  email!: string;
  password!: string;
}
`;
}

export function nestLayeredFiles(config: ProjectSetupConfig): FileTemplate[] {
  const rel = relPrefix(config);
  const slug = slugify(config.projectName);

  const files: FileTemplate[] = [
    { relativePath: `${rel}src/main.ts`, content: mainSource() },
    { relativePath: `${rel}src/app.module.ts`, content: appModuleSource(config) },
    {
      relativePath: `${rel}src/common/filters/http-exception.filter.ts`,
      content: httpExceptionFilterSource(),
    },
    {
      relativePath: `${rel}src/modules/health/health.module.ts`,
      content: healthModuleSource(),
    },
    {
      relativePath: `${rel}src/modules/health/health.controller.ts`,
      content: healthControllerSource(),
    },
    {
      relativePath: `${rel}src/modules/health/health.service.ts`,
      content: healthServiceSource(slug),
    },
  ];

  if (usesPrismaBackend(config)) {
    files.push(
      { relativePath: `${rel}src/prisma/prisma.module.ts`, content: prismaModuleSource() },
      { relativePath: `${rel}src/prisma/prisma.service.ts`, content: prismaServiceSource() },
      {
        relativePath: `${rel}src/modules/users/users.module.ts`,
        content: usersModuleSource(),
      },
      {
        relativePath: `${rel}src/modules/users/users.controller.ts`,
        content: usersControllerSource(config),
      },
      {
        relativePath: `${rel}src/modules/users/users.service.ts`,
        content: usersServicePrismaSource(),
      },
    );
  } else if (usesMongo(config)) {
    files.push(
      {
        relativePath: `${rel}src/modules/users/schemas/user.schema.ts`,
        content: userSchemaMongoSource(),
      },
      {
        relativePath: `${rel}src/modules/users/users.module.ts`,
        content: usersModuleMongoSource(),
      },
      {
        relativePath: `${rel}src/modules/users/users.controller.ts`,
        content: usersControllerSource(config),
      },
      {
        relativePath: `${rel}src/modules/users/users.service.ts`,
        content: usersServiceMongoSource(),
      },
    );
  }

  if (usesJwt(config)) {
    files.push(
      { relativePath: `${rel}src/modules/auth/auth.module.ts`, content: authModuleSource() },
      {
        relativePath: `${rel}src/modules/auth/auth.controller.ts`,
        content: authControllerSource(),
      },
      { relativePath: `${rel}src/modules/auth/auth.service.ts`, content: authServiceSource() },
      {
        relativePath: `${rel}src/modules/auth/strategies/jwt.strategy.ts`,
        content: jwtStrategySource(),
      },
      { relativePath: `${rel}src/modules/auth/dto/login.dto.ts`, content: loginDtoSource() },
      { relativePath: `${rel}src/modules/auth/dto/register.dto.ts`, content: registerDtoSource() },
      {
        relativePath: `${rel}src/common/guards/jwt-auth.guard.ts`,
        content: jwtAuthGuardSource(),
      },
    );
  }

  return files;
}

export function nestPrismaSchemaFiles(config: ProjectSetupConfig): FileTemplate[] {
  if (!usesPrismaBackend(config) || config.backendFramework !== "nestjs") return [];

  const rel = relPrefix(config);
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
}
