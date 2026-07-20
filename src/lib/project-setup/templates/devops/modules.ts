import type { StackModule } from "@/lib/project-setup/templates/registry";
import type { ProjectSetupConfig } from "@/lib/project-setup/types";
import {
  muiInstallArgs,
  muiNextThemeFiles,
  nextFontCssFile,
  viteMuiIndexCss,
  viteMuiThemeFiles,
} from "@/lib/project-setup/templates/frontend/styling-templates";
import { installLatestArgs } from "@/lib/project-setup/templates/package-latest";
import { frontendRelPrefix, scopeIncludesFrontend } from "@/lib/project-setup/templates/shared";

function dbServiceBlock(config: ProjectSetupConfig): string {
  if (config.database === "postgresql") {
    return `  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      - POSTGRES_USER=app
      - POSTGRES_PASSWORD=app
      - POSTGRES_DB=app
    ports:
      - "5432:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
`;
  }
  if (config.database === "mongodb") {
    return `  db:
    image: mongo:7
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - db-data:/data/db
`;
  }
  return "";
}

function dbEnvLine(config: ProjectSetupConfig): string {
  if (config.database === "postgresql") {
    return "      - DATABASE_URL=postgresql://app:app@db:5432/app\n";
  }
  if (config.database === "mongodb") {
    return "      - MONGODB_URI=mongodb://db:27017/app\n";
  }
  return "";
}

export const dockerModule: StackModule = {
  id: "devops-docker",
  appliesTo: (c) => c.docker,
  checklist: () => ["Docker Compose"],
  dependencies: () => [],
  // Previously this always emitted ONE root Dockerfile with
  // CMD ["npm", "run", "dev"], which:
  //   1. Only makes sense if there's a root package.json - full_stack
  //      projects don't have one, since frontend/ and backend/ each have
  //      their own. The old Dockerfile silently doesn't work for that scope.
  //   2. Used the dev server inside the container, not a real build - fine
  //      for local convenience, but worth being explicit about instead of
  //      passing it off as a deployable image.
  //   3. Never wired up a database service even though `database` is
  //      already tracked on the config.
  files: (config) => {
    const dbBlock = dbServiceBlock(config);
    const dbEnv = dbEnvLine(config);
    // Derive "is there a db?" from whether dbServiceBlock() actually
    // produced something, rather than comparing config.database to a
    // "none" literal - that literal isn't part of the DatabaseOption type
    // (TS flagged this), and deriving it from dbBlock works regardless of
    // what the actual literal union looks like.
    const hasDb = dbBlock.length > 0;
    const dbVolume = hasDb ? `volumes:\n  db-data:\n` : "";
    const dependsOn = hasDb ? "    depends_on:\n      - db\n" : "";

    if (config.projectScope === "full_stack") {
      return [
        {
          relativePath: "frontend/Dockerfile",
          content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Dev convenience image - for a real deploy, run \`npm run build\` and
# serve the output instead (e.g. \`npm run build && npm run start\`).
CMD ["npm", "run", "dev"]
`,
        },
        {
          relativePath: "backend/Dockerfile",
          content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
`,
        },
        {
          relativePath: "docker-compose.yml",
          content: `services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=development
${dbEnv}${dependsOn}${dbBlock}# ${config.projectName} - extend as needed
${dbVolume}`,
        },
      ];
    }

    return [
      {
        relativePath: "docker-compose.yml",
        content: `services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
${dbEnv}${dependsOn}${dbBlock}# ${config.projectName} - extend as needed
${dbVolume}`,
      },
      {
        relativePath: "Dockerfile",
        content: `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
`,
      },
    ];
  },
  commands: () => [],
};

function githubActionsSteps(config: ProjectSetupConfig): string {
  const isFlutter =
    scopeIncludesFrontend(config) && config.frontendFramework === "flutter";

  const flutterSteps = (workingDirectory: string) => `      - uses: subosito/flutter-action@v2
        with:
          channel: stable
          cache: true
      - name: Flutter pub get
        working-directory: ${workingDirectory}
        run: flutter pub get
      - name: Flutter analyze
        working-directory: ${workingDirectory}
        run: flutter analyze
      - name: Flutter test
        working-directory: ${workingDirectory}
        run: flutter test`;

  if (config.projectScope === "full_stack") {
    const frontendSteps = isFlutter
      ? flutterSteps("frontend")
      : `      - name: Install & test frontend
        working-directory: frontend
        run: npm ci || npm install
      - name: Build frontend
        working-directory: frontend
        run: npm run build --if-present`;

    return `${frontendSteps}
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install & test backend
        working-directory: backend
        run: npm ci || npm install
      - name: Test backend
        working-directory: backend
        run: npm test --if-present`;
  }

  if (config.projectScope === "frontend_only" && isFlutter) {
    return flutterSteps(".");
  }

  return `      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci || npm install
      - run: npm test --if-present`;
}

export const githubActionsModule: StackModule = {
  id: "devops-gha",
  appliesTo: (c) => c.githubActions,
  checklist: () => ["GitHub Actions CI"],
  dependencies: () => [],
  // Previously ran `npm ci` at the repo root unconditionally. That only
  // works when there's a root package.json + lockfile. full_stack and
  // backend_only scopes don't have one (frontend/backend each have their
  // own), so CI would fail immediately on those scopes. Now it builds
  // working-directory steps per scope.
  files: (config) => {
    const steps = githubActionsSteps(config);
    const needsNodeAtTop =
      config.projectScope !== "full_stack" &&
      !(config.projectScope === "frontend_only" && config.frontendFramework === "flutter");

    return [
      {
        relativePath: ".github/workflows/ci.yml",
        content: `name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
${needsNodeAtTop ? `      - uses: actions/setup-node@v4
        with:
          node-version: "20"
` : ""}${steps}
# ${config.projectName}
`,
      },
    ];
  },
  commands: () => [],
};

export const deployStubModule: StackModule = {
  id: "devops-deploy",
  appliesTo: (c) => c.deploymentTarget !== "none",
  checklist: (c) => [`Deploy stub: ${c.deploymentTarget}`],
  dependencies: () => [],
  files: (config) => [
    {
      relativePath: `deploy/${config.deploymentTarget}.md`,
      content: `# Deploy to ${config.deploymentTarget}\n\nConfigure your ${config.deploymentTarget} project and connect this repository.\n`,
    },
  ],
  commands: () => [],
};

export const stylingStubModule: StackModule = {
  id: "styling-mui",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) && c.styling === "mui",
  checklist: () => ["Material UI theme, CssBaseline, and App Router cache provider"],
  dependencies: () => ["@mui/material", "@mui/material-nextjs", "@emotion/react", "@emotion/styled"],
  files: (config) => {
    const rel = frontendRelPrefix(config);
    if (config.frontendFramework === "nextjs") {
      return [...muiNextThemeFiles(rel), nextFontCssFile(rel)];
    }
    if (config.frontendFramework === "react") {
      return [
        ...viteMuiThemeFiles(rel),
        {
          relativePath: `${rel}src/index.css`,
          writePhase: "post",
          content: viteMuiIndexCss(),
        },
      ];
    }
    return [];
  },
  commands: (config, root) => {
    const cwd = config.projectScope === "frontend_only" ? root : `${root}/frontend`;
    return [
      {
        id: "styling-install",
        label: "Installing MUI dependencies",
        exe: "npm",
        args: muiInstallArgs(),
        cwd,
        timeoutMs: 300_000,
        phase: "post",
      },
    ];
  },
};

export const stateStubModule: StackModule = {
  id: "state-management",
  appliesTo: (c) => {
    if (!scopeIncludesFrontend(c) || c.stateManagement === "context") return false;
    if (c.stateManagement === "redux" || c.stateManagement === "zustand") return false;
    return true;
  },
  checklist: (c) => [`State: ${c.stateManagement}`],
  dependencies: (c) =>
    c.stateManagement === "redux" ? ["@reduxjs/toolkit", "react-redux"] : ["zustand"],
  files: (config) => [
    {
      relativePath:
        config.projectScope === "frontend_only"
          ? "src/store/README.md"
          : "frontend/src/store/README.md",
      content: `# State management (${config.stateManagement})\n\nAdd store setup here.\n`,
    },
  ],
  commands: (config, root) => {
    const cwd =
      config.projectScope === "frontend_only" ? root : `${root}/frontend`;
    const pkgs =
      config.stateManagement === "redux"
        ? ["@reduxjs/toolkit", "react-redux"]
        : ["zustand"];
    return [
      {
        id: "state-install",
        label: `Installing ${config.stateManagement}`,
        exe: "npm",
        args: installLatestArgs(...pkgs),
        cwd,
        timeoutMs: 300_000,
        phase: "post",
      },
    ];
  },
};
