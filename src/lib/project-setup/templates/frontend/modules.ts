import type { StackModule } from "@/lib/project-setup/templates/registry";
import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { scopeIncludesFrontend, frontendRelPrefix } from "@/lib/project-setup/templates/shared";

function frontendCwd(config: ProjectSetupConfig, root: string): string {
  return config.projectScope === "frontend_only" ? root : `${root}/frontend`;
}

function usesTailwindCna(config: ProjectSetupConfig): boolean {
  return config.styling === "tailwind" || config.styling === "shadcn";
}

/**
 * @/* path aliases for Vite + shadcn.
 * Must be written in the pre phase (before `shadcn init`): the CLI reads root
 * tsconfig.json via tsconfig-paths and does not follow project references.
 * TS 6 deprecates baseUrl — use fully-qualified paths entries instead.
 */
function viteTsconfigAliasFiles(rel: string, writePhase: "pre" | "post"): FileTemplate[] {
  const paths = { "@/*": ["./src/*"] };

  return [
    {
      relativePath: `${rel}tsconfig.json`,
      writePhase,
      content: `${JSON.stringify(
        {
          files: [],
          references: [
            { path: "./tsconfig.app.json" },
            { path: "./tsconfig.node.json" },
          ],
          compilerOptions: { paths },
        },
        null,
        2
      )}\n`,
    },
    {
      relativePath: `${rel}tsconfig.app.json`,
      writePhase,
      content: `${JSON.stringify(
        {
          compilerOptions: {
            paths,
            tsBuildInfoFile: "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
            target: "ES2023",
            lib: ["ES2023", "DOM"],
            module: "ESNext",
            types: ["vite/client"],
            allowArbitraryExtensions: true,
            skipLibCheck: true,
            moduleResolution: "bundler",
            allowImportingTsExtensions: true,
            verbatimModuleSyntax: true,
            moduleDetection: "force",
            noEmit: true,
            jsx: "react-jsx",
            noUnusedLocals: true,
            noUnusedParameters: true,
            erasableSyntaxOnly: true,
            noFallthroughCasesInSwitch: true,
          },
          include: ["src"],
        },
        null,
        2
      )}\n`,
    },
  ];
}

/** Vite + Tailwind v4 (@tailwindcss/vite). Optional @/* alias for shadcn. */
function viteTailwindPrepFiles(
  rel: string,
  withImportAlias: boolean,
  tsconfigWritePhase: "pre" | "post" = "pre"
): FileTemplate[] {
  const files: FileTemplate[] = [
    {
      relativePath: `${rel}src/vite-env.d.ts`,
      content: `/// <reference types="vite/client" />\n`,
    },
    {
      relativePath: `${rel}src/index.css`,
      content: `@import "tailwindcss";\n`,
    },
    {
      relativePath: `${rel}vite.config.ts`,
      content: withImportAlias
        ? `import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
`
        : `import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`,
    },
  ];

  if (withImportAlias) {
    files.push(...viteTsconfigAliasFiles(rel, tsconfigWritePhase));
  }

  return files;
}

function viteTailwindInstallCommand(
  config: ProjectSetupConfig,
  root: string,
  id: string,
  label: string,
  withTypesNode: boolean
) {
  const cwd = frontendCwd(config, root);
  const pkgs = ["tailwindcss", "@tailwindcss/vite"];
  if (withTypesNode) pkgs.push("@types/node");
  return {
    id,
    label,
    exe: "npm",
    args: ["install", "-D", ...pkgs],
    cwd,
    timeoutMs: 300_000,
    phase: "post" as const,
  };
}export const nextjsModule: StackModule = {
  id: "frontend-nextjs",
  appliesTo: (c) => scopeIncludesFrontend(c) && c.frontendFramework === "nextjs",
  checklist: () => ["Next.js app with TypeScript"],
  dependencies: () => ["next", "react", "react-dom", "typescript"],
  // NOTE: create-next-app generates its own README.md. Make sure this
  // file write happens AFTER the "next-init" command runs (phase: "pre"),
  // or create-next-app will overwrite it.
  files: (config) => {
    if (config.projectScope === "frontend_only") return [];
    const content =
      config.styling === "shadcn"
        ? `# ${config.projectName} Frontend\n\nNext.js + Tailwind + ShadCN UI\n`
        : config.styling === "tailwind"
          ? `# ${config.projectName} Frontend\n\nNext.js + Tailwind\n`
          : `# ${config.projectName} Frontend\n\nNext.js\n`;
    return [{ relativePath: "frontend/README.md", content }];
  },
  commands: (config, root) => {
    const args = [
      // Force npx to skip its own "ok to install create-next-app?" prompt —
      // without this, a non-TTY child process (the local executor) can hang
      // waiting on stdin that will never arrive.
      "--yes",
      "create-next-app@latest",
      config.projectScope === "frontend_only" ? "." : "frontend",
      "--typescript",
      "--eslint",
      "--app",
      "--src-dir",
      "--import-alias",
      "@/*",
    ];
    if (usesTailwindCna(config)) {
      args.push("--tailwind");
    } else {
      args.push("--no-tailwind");
    }
    return [
      {
        id: "next-init",
        label: "Initializing Next.js",
        exe: "npx",
        args,
        // cwd is always root regardless of scope — the scope distinction is
        // handled by the target-directory positional arg above ("." vs
        // "frontend"), not by cwd. (Previously this was a no-op ternary
        // that always evaluated to `root` either way.)
        cwd: root,
        timeoutMs: 600_000,
        phase: "pre",
      },
    ];
  },
};

export const reactViteModule: StackModule = {
  id: "frontend-react-vite",
  appliesTo: (c) => scopeIncludesFrontend(c) && c.frontendFramework === "react",
  checklist: () => ["React (Vite) app with TypeScript"],
  dependencies: () => ["react", "vite", "typescript"],
  files: () => [],
  commands: (config, root) => {
    const dir = config.projectScope === "frontend_only" ? "." : "frontend";
    return [
      {
        id: "vite-init",
        label: "Creating Vite React app",
        exe: "npm",
        // --yes avoids npm's "Need to install create-vite, ok to proceed?"
        // prompt hanging a non-interactive child process. Double-check this
        // flag placement against the npm version your executor environment
        // ships, since `npm create` flag parsing has shifted across npm
        // major versions.
        args: ["create", "vite@latest", dir, "--yes", "--", "--template", "react-ts"],
        cwd: root,
        timeoutMs: 600_000,
        phase: "pre",
      },
      {
        id: "vite-install",
        label: "Installing frontend dependencies",
        exe: "npm",
        args: ["install"],
        cwd: config.projectScope === "frontend_only" ? root : `${root}/frontend`,
        timeoutMs: 600_000,
        phase: "post",
      },
    ];
  },
};

export const shadcnFrontendModule: StackModule = {
  id: "styling-shadcn",
  appliesTo: (c) => scopeIncludesFrontend(c) && c.styling === "shadcn",
  checklist: () => ["ShadCN UI initialized (includes Button starter)"],
  dependencies: () => ["class-variance-authority", "clsx", "tailwind-merge"],
  files: (config) => {
    if (config.frontendFramework !== "react") return [];
    const rel = frontendRelPrefix(config);
    // Aliases must land in the pre phase (see viteTsconfigAliasFiles). A post-phase
    // duplicate would dedupe over pre and run shadcn init before aliases exist.
    return viteTailwindPrepFiles(rel, true, "pre");
  },
  commands: (config, root) => {
    const cwd = frontendCwd(config, root);
    const template = config.frontendFramework === "nextjs" ? "next" : "vite";
    const initArgs = [
      "--yes",
      "shadcn@latest",
      "init",
      "--yes",
      "--defaults",
      "--template",
      template,
    ];

    const steps = [];
    if (config.frontendFramework === "react") {
      steps.push(
        viteTailwindInstallCommand(
          config,
          root,
          "vite-tailwind-shadcn",
          "Installing Tailwind for ShadCN",
          true
        )
      );
    }
    steps.push({
      id: "shadcn-init",
      label: "Initializing ShadCN UI",
      exe: "npx",
      args: initArgs,
      cwd,
      timeoutMs: 600_000,
      phase: "post" as const,
    });
    return steps;
  },
};
export const tailwindFrontendModule: StackModule = {
  id: "styling-tailwind-react",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) && c.frontendFramework === "react" && c.styling === "tailwind",
  checklist: () => ["Tailwind CSS (v4, Vite plugin)"],
  dependencies: () => ["tailwindcss", "@tailwindcss/vite"],
  files: (config) => viteTailwindPrepFiles(frontendRelPrefix(config), false),
  commands: (config, root) => [
    viteTailwindInstallCommand(config, root, "tailwind-init", "Adding Tailwind CSS", false),
  ],
};

/** Shared counter slice for Redux demo stores. */
function reduxCounterSliceContent(): string {
  return `import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CounterState {
  value: number;
}

const initialState: CounterState = {
  value: 0,
};

export const counterSlice = createSlice({
  name: "counter",
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
`;
}

function reduxInstallCommand(
  config: ProjectSetupConfig,
  root: string
): import("@/lib/project-setup/types").CommandStep {
  return {
    id: "redux-install",
    label: "Installing Redux Toolkit",
    exe: "npm",
    args: ["install", "@reduxjs/toolkit", "react-redux"],
    cwd: frontendCwd(config, root),
    timeoutMs: 300_000,
    phase: "post",
  };
}

function reduxViteCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const shadcnImport =
    styling === "shadcn" ? 'import { Button } from "@/components/ui/button";\n' : "";
  const muiImport = styling === "mui" ? 'import Button from "@mui/material/Button";\n' : "";

  const ui =
    styling === "shadcn"
      ? `<div className="flex items-center gap-4">
      <Button onClick={() => dispatch(increment())}>Increment</Button>
      <span className="min-w-[2ch] text-center text-lg tabular-nums">{count}</span>
      <Button onClick={() => dispatch(decrement())}>Decrement</Button>
    </div>`
      : styling === "mui"
        ? `<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Button variant="contained" onClick={() => dispatch(increment())}>
        Increment
      </Button>
      <span style={{ minWidth: "2ch", textAlign: "center", fontSize: "1.125rem" }}>
        {count}
      </span>
      <Button variant="contained" onClick={() => dispatch(decrement())}>
        Decrement
      </Button>
    </div>`
        : `<div className="flex items-center gap-4">
      <button
        type="button"
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
        onClick={() => dispatch(increment())}
      >
        Increment
      </button>
      <span className="min-w-[2ch] text-center text-lg tabular-nums">{count}</span>
      <button
        type="button"
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
        onClick={() => dispatch(decrement())}
      >
        Decrement
      </button>
    </div>`;

  return {
    relativePath: `${rel}src/features/counter/Counter.tsx`,
    content: `import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../app/store";
import { decrement, increment } from "./counterSlice";
${shadcnImport}${muiImport}
export function Counter() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  return (
    ${ui}
  );
}
`,
  };
}

/** Redux Toolkit quick start for Vite — https://redux-toolkit.js.org/tutorials/quick-start */
function reduxViteSourceFiles(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/app/store.ts`,
      content: `import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
`,
    },
    {
      relativePath: `${rel}src/features/counter/counterSlice.ts`,
      content: reduxCounterSliceContent(),
    },
    reduxViteCounterFile(rel, styling),
  ];
}

export const reduxViteModule: StackModule = {
  id: "state-redux-vite",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) &&
    c.frontendFramework === "react" &&
    c.stateManagement === "redux",
  checklist: () => ["Redux Toolkit store, counter slice, and Provider wired in"],
  dependencies: () => ["@reduxjs/toolkit", "react-redux"],
  files: (config) => {
    const rel = frontendRelPrefix(config);
    return [
      ...reduxViteSourceFiles(rel, config.styling),
      {
        relativePath: `${rel}src/main.tsx`,
        writePhase: "post",
        content: `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.tsx";
import { store } from "./app/store";

const container = document.getElementById("root");
if (!container) {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  );
}

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
`,
      },
      {
        relativePath: `${rel}src/App.tsx`,
        writePhase: "post",
        content: `import { Counter } from "./features/counter/Counter";

export default function App() {
  return (
    <main className="flex min-h-svh items-center justify-center">
      <Counter />
    </main>
  );
}
`,
      },
    ];
  },
  commands: (config, root) => [reduxInstallCommand(config, root)],
};

/**
 * Redux Toolkit for Next.js App Router — https://redux-toolkit.js.org/usage/nextjs
 * Uses makeStore + StoreProvider (per-request safe, no global store).
 */
function reduxNextCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const shadcnImport =
    styling === "shadcn" ? 'import { Button } from "@/components/ui/button";\n' : "";
  const muiImport = styling === "mui" ? 'import Button from "@mui/material/Button";\n' : "";
  const ui =
    styling === "shadcn"
      ? `<div className="flex items-center gap-4">
      <Button type="button" onClick={() => dispatch(increment())}>
        Increment
      </Button>
      <span className="min-w-[2ch] text-center text-lg tabular-nums">{count}</span>
      <Button type="button" onClick={() => dispatch(decrement())}>
        Decrement
      </Button>
    </div>`
      : styling === "mui"
        ? `<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <Button variant="contained" onClick={() => dispatch(increment())}>
        Increment
      </Button>
      <span style={{ minWidth: "2ch", textAlign: "center", fontSize: "1.125rem" }}>
        {count}
      </span>
      <Button variant="contained" onClick={() => dispatch(decrement())}>
        Decrement
      </Button>
    </div>`
        : `<div className="flex items-center gap-4">
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        onClick={() => dispatch(increment())}
      >
        Increment
      </button>
      <span className="min-w-[2ch] text-center text-lg tabular-nums">{count}</span>
      <button
        type="button"
        className="rounded-md border px-4 py-2"
        onClick={() => dispatch(decrement())}
      >
        Decrement
      </button>
    </div>`;

  return {
    relativePath: `${rel}src/lib/features/counter/Counter.tsx`,
    content: `"use client";

import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { decrement, increment } from "./counterSlice";
${shadcnImport}${muiImport}
export function Counter() {
  const count = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    ${ui}
  );
}
`,
  };
}

function reduxNextSourceFiles(config: ProjectSetupConfig): import("@/lib/project-setup/types").FileTemplate[] {
  const rel = frontendRelPrefix(config);

  return [
    {
      relativePath: `${rel}src/lib/store.ts`,
      content: `import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./features/counter/counterSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      counter: counterReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
`,
    },
    {
      relativePath: `${rel}src/lib/hooks.ts`,
      content: `import { useDispatch, useSelector, useStore } from "react-redux";
import type { AppDispatch, AppStore, RootState } from "./store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
`,
    },
    {
      relativePath: `${rel}src/lib/features/counter/counterSlice.ts`,
      content: reduxCounterSliceContent(),
    },
    reduxNextCounterFile(rel, config.styling),
    {
      relativePath: `${rel}src/app/StoreProvider.tsx`,
      content: `"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/lib/store";

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeRef = useRef<AppStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
`,
    },
    {
      relativePath: `${rel}src/app/layout.tsx`,
      writePhase: "post",
      content: `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "${config.projectName}",
  description: "Generated by AgentHub Project Setup Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={\`\${geistSans.variable} \${geistMono.variable} antialiased\`}
      >
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
`,
    },
    {
      relativePath: `${rel}src/app/page.tsx`,
      writePhase: "post",
      content: `import { Counter } from "@/lib/features/counter/Counter";

export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      <Counter />
    </main>
  );
}
`,
    },
  ];
}

export const reduxNextModule: StackModule = {
  id: "state-redux-next",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) &&
    c.frontendFramework === "nextjs" &&
    c.stateManagement === "redux",
  checklist: () => [
    "Redux Toolkit makeStore, typed hooks, StoreProvider, and counter slice (App Router)",
  ],
  dependencies: () => ["@reduxjs/toolkit", "react-redux"],
  files: (config) => reduxNextSourceFiles(config),
  commands: (config, root) => [reduxInstallCommand(config, root)],
};