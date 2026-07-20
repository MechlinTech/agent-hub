import type { StackModule } from "@/lib/project-setup/templates/registry";
import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import path from "path";
import { installLatestArgs, installLatestDevArgs } from "@/lib/project-setup/templates/package-latest";
import {
  buildNextRootLayout,
  buildViteMainEntry,
  nextFontCssFile,
  nextHomePageContent,
  viteDashboardAppContent,
  viteInterFontsCssFile,
  viteInterIndexCss,
} from "@/lib/project-setup/templates/frontend/styling-templates";
import { scopeIncludesFrontend, frontendRelPrefix } from "@/lib/project-setup/templates/shared";
import { flutterLayeredFiles, flutterPackageName } from "@/lib/project-setup/templates/frontend/flutter-templates";
import {
  REACT_NATIVE_EXTRA_DEPENDENCIES,
  REACT_NATIVE_EXTRA_DEV_DEPENDENCIES,
  reactNativeAndroidPackage,
  reactNativeLayeredFiles,
} from "@/lib/project-setup/templates/frontend/react-native-templates";

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
 * shadcn CLI requires baseUrl + paths in tsconfig (reads root tsconfig via tsconfig-paths).
 */
function viteTsconfigAliasFiles(rel: string, writePhase: "pre" | "post"): FileTemplate[] {
  const paths = { "@/*": ["./src/*"] };
  const aliasOptions = { baseUrl: ".", paths };

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
          compilerOptions: aliasOptions,
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
            ...aliasOptions,
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
      relativePath: `${rel}tailwind.config.ts`,
      content: `import type { Config } from "tailwindcss";

/** Minimal config for shadcn CLI validation; Tailwind v4 uses @tailwindcss/vite at build time. */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
} satisfies Config;
`,
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
    args: installLatestDevArgs(...pkgs),
    cwd,
    timeoutMs: 300_000,
    phase: "post" as const,
  };
}

/** Counter controls styled for the dashboard center card. */
function counterDemoUi(
  styling: ProjectSetupConfig["styling"],
  incrementAttr: string,
  decrementAttr: string,
): { shadcnImport: string; muiImport: string; ui: string } {
  const shadcnImport =
    styling === "shadcn" ? 'import { Button } from "@/components/ui/button";\n' : "";
  const muiImport = styling === "mui" ? 'import Box from "@mui/material/Box";\nimport Button from "@mui/material/Button";\nimport Typography from "@mui/material/Typography";\n' : "";

  const ui =
    styling === "shadcn"
      ? `<div className="flex flex-col items-center gap-4">
      <span className="text-4xl font-bold tabular-nums tracking-tight text-slate-900">{count}</span>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-full text-lg" ${decrementAttr}>
          −
        </Button>
        <Button type="button" size="icon" className="h-10 w-10 rounded-full text-lg" ${incrementAttr}>
          +
        </Button>
      </div>
    </div>`
      : styling === "mui"
        ? `<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <Typography
        component="span"
        variant="h3"
        sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
      >
        {count}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button variant="outlined" sx={{ minWidth: 40, width: 40, height: 40, borderRadius: "999px", p: 0, fontSize: 18 }} ${decrementAttr}>
          −
        </Button>
        <Button variant="contained" sx={{ minWidth: 40, width: 40, height: 40, borderRadius: "999px", p: 0, fontSize: 18, bgcolor: "#2563eb" }} ${incrementAttr}>
          +
        </Button>
      </Box>
    </Box>`
        : `<div className="flex flex-col items-center gap-4">
      <span className="text-4xl font-bold tabular-nums tracking-tight text-slate-900">{count}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg font-medium shadow-sm hover:bg-slate-50"
          ${decrementAttr}
        >
          −
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg font-medium text-white shadow-sm hover:bg-blue-500"
          ${incrementAttr}
        >
          +
        </button>
      </div>
    </div>`;

  return { shadcnImport, muiImport, ui };
}

export const nextjsModule: StackModule = {
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
      // Force npx to skip its own "ok to install create-next-app?" prompt -
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
        // cwd is always root regardless of scope - the scope distinction is
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

export const flutterModule: StackModule = {
  id: "frontend-flutter",
  appliesTo: (c) => scopeIncludesFrontend(c) && c.frontendFramework === "flutter",
  checklist: () => [
    "Flutter app with GetX architecture (Tapsy-inspired layout)",
    "FCM notification handlers (foreground, background, killed state)",
    "Branded splash + polished home screen with reusable UI widgets",
    "Dummy launcher icon and Android notification icon included",
    "Poppins-Regular.ttf bundled in assets/fonts/",
    "Run flutterfire configure to replace firebase_options.dart stub",
  ],
  dependencies: () => ["get", "firebase_core", "firebase_messaging", "dio"],
  files: (config) => flutterLayeredFiles(config),
  commands: (config, root) => {
    const dir = config.projectScope === "frontend_only" ? "." : "frontend";
    const pkg = flutterPackageName(config.projectName);
    const cwd = frontendCwd(config, root);
    return [
      {
        id: "flutter-init",
        label: "Creating Flutter project",
        exe: "flutter",
        args: [
          "create",
          dir,
          "--org",
          "com.example",
          "--project-name",
          pkg,
        ],
        cwd: root,
        timeoutMs: 600_000,
        phase: "pre",
      },
      {
        id: "flutter-pub-get",
        label: "Installing Flutter dependencies",
        exe: "flutter",
        args: ["pub", "get"],
        cwd,
        timeoutMs: 600_000,
        phase: "post",
      },
    ];
  },
};

export const reactNativeModule: StackModule = {
  id: "frontend-react-native",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) && c.frontendFramework === "react-native",
  checklist: () => [
    "React Native CLI app with App/InnerApp architecture",
    "FCM + Notifee handlers (foreground, background, killed state)",
    "Light/dark/system theme with in-app toggle",
    "Flatlogic-inspired UI components + gradient home screen",
    "Replace placeholder Firebase config files (see FIREBASE_SETUP.md)",
  ],
  dependencies: () => [...REACT_NATIVE_EXTRA_DEPENDENCIES],
  files: (config) => reactNativeLayeredFiles(config),
  commands: (config, root) => {
    const isFrontendOnly = config.projectScope === "frontend_only";
    const cwd = frontendCwd(config, root);
    const androidPackage = reactNativeAndroidPackage(config.projectName);
    // RN CLI resolves `--directory .` via path.relative(cwd, '.') which is '' on
    // Windows and crashes with mkdir(''). For frontend-only, init from the parent
    // folder so the default projectName directory lands in projectRoot (same
    // pattern as create-next-app using "." from projectRoot).
    const initCwd = isFrontendOnly ? path.dirname(root) : root;
    const initArgs = [
      "@react-native-community/cli@latest",
      "init",
      config.projectName,
      "--package-name",
      androidPackage,
      "--skip-install",
      "--pm",
      "npm",
      "--replace-directory",
      "true",
    ];
    if (!isFrontendOnly) {
      initArgs.push("--directory", "frontend");
    }
    return [
      {
        id: "react-native-init",
        label: "Creating React Native project",
        exe: "npx",
        args: initArgs,
        cwd: initCwd,
        timeoutMs: 900_000,
        phase: "pre",
      },
      {
        id: "react-native-install",
        label: "Installing npm dependencies",
        exe: "npm",
        args: ["install"],
        cwd,
        timeoutMs: 600_000,
        phase: "post",
      },
      {
        id: "react-native-extra-deps",
        label: "Installing React Native template dependencies",
        exe: "npm",
        args: [
          "install",
          ...REACT_NATIVE_EXTRA_DEPENDENCIES,
          ...REACT_NATIVE_EXTRA_DEV_DEPENDENCIES.map((dep) => ["-D", dep]).flat(),
        ],
        cwd,
        timeoutMs: 600_000,
        phase: "post",
      },
      {
        id: "react-native-android-firebase",
        label: "Configuring Android Firebase build",
        exe: "node",
        args: ["scripts/configure-firebase-android.mjs"],
        cwd,
        timeoutMs: 60_000,
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
    const rel = frontendRelPrefix(config);
    if (config.frontendFramework === "react") {
      return [
        ...viteTailwindPrepFiles(rel, true, "pre"),
        viteInterFontsCssFile(rel),
      ];
    }
    if (config.frontendFramework === "nextjs") {
      return [nextFontCssFile(rel)];
    }
    return [];
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
  files: (config) => {
    const rel = frontendRelPrefix(config);
    return [
      ...viteTailwindPrepFiles(rel, false),
      {
        relativePath: `${rel}src/index.css`,
        writePhase: "post",
        content: viteInterIndexCss(),
      },
    ];
  },
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
    args: installLatestArgs("@reduxjs/toolkit", "react-redux"),
    cwd: frontendCwd(config, root),
    timeoutMs: 300_000,
    phase: "post",
  };
}

function reduxViteCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const { shadcnImport, muiImport, ui } = counterDemoUi(
    styling,
    'onClick={() => dispatch(increment())}',
    'onClick={() => dispatch(decrement())}',
  );

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

/** Redux Toolkit quick start for Vite - https://redux-toolkit.js.org/tutorials/quick-start */
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
        content: buildViteMainEntry(config),
      },
      {
        relativePath: `${rel}src/App.tsx`,
        writePhase: "post",
        content: viteDashboardAppContent(config, "./features/counter/Counter"),
      },
    ];
  },
  commands: (config, root) => [reduxInstallCommand(config, root)],
};

/**
 * Redux Toolkit for Next.js App Router - https://redux-toolkit.js.org/usage/nextjs
 * Uses makeStore + StoreProvider (per-request safe, no global store).
 */
function reduxNextCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const { shadcnImport, muiImport, ui } = counterDemoUi(
    styling,
    'onClick={() => dispatch(increment())}',
    'onClick={() => dispatch(decrement())}',
  );

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
      content: buildNextRootLayout(config, "{children}"),
    },
    nextFontCssFile(rel),
    {
      relativePath: `${rel}src/app/page.tsx`,
      writePhase: "post",
      content: nextHomePageContent(config, "@/lib/features/counter/Counter"),
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

/** Zustand counter store - https://zustand.docs.pmnd.rs/learn/getting-started/introduction */
function zustandCounterStoreContent(): string {
  return `import { create } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
`;
}

function zustandInstallCommand(
  config: ProjectSetupConfig,
  root: string
): import("@/lib/project-setup/types").CommandStep {
  return {
    id: "zustand-install",
    label: "Installing Zustand",
    exe: "npm",
    args: installLatestArgs("zustand"),
    cwd: frontendCwd(config, root),
    timeoutMs: 300_000,
    phase: "post",
  };
}

function zustandCounterUi(styling: ProjectSetupConfig["styling"]): {
  shadcnImport: string;
  muiImport: string;
  ui: string;
} {
  return counterDemoUi(styling, "onClick={increment}", "onClick={decrement}");
}

function zustandViteCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const { shadcnImport, muiImport, ui } = zustandCounterUi(styling);

  return {
    relativePath: `${rel}src/features/counter/Counter.tsx`,
    content: `import { useCounterStore } from "../../stores/useCounterStore";
${shadcnImport}${muiImport}
export function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    ${ui}
  );
}
`,
  };
}

function zustandViteSourceFiles(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/stores/useCounterStore.ts`,
      content: zustandCounterStoreContent(),
    },
    zustandViteCounterFile(rel, styling),
  ];
}

export const zustandViteModule: StackModule = {
  id: "state-zustand-vite",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) &&
    c.frontendFramework === "react" &&
    c.stateManagement === "zustand",
  checklist: () => ["Zustand counter store and demo Counter component wired in"],
  dependencies: () => ["zustand"],
  files: (config) => {
    const rel = frontendRelPrefix(config);
    return [
      ...zustandViteSourceFiles(rel, config.styling),
      {
        relativePath: `${rel}src/main.tsx`,
        writePhase: "post",
        content: buildViteMainEntry(config),
      },
      {
        relativePath: `${rel}src/App.tsx`,
        writePhase: "post",
        content: viteDashboardAppContent(config, "./features/counter/Counter"),
      },
    ];
  },
  commands: (config, root) => [zustandInstallCommand(config, root)],
};

function zustandNextCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const { shadcnImport, muiImport, ui } = zustandCounterUi(styling);

  return {
    relativePath: `${rel}src/lib/features/counter/Counter.tsx`,
    content: `"use client";

import { useCounterStore } from "@/lib/stores/useCounterStore";
${shadcnImport}${muiImport}
export function Counter() {
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const decrement = useCounterStore((state) => state.decrement);

  return (
    ${ui}
  );
}
`,
  };
}

function zustandNextSourceFiles(config: ProjectSetupConfig): import("@/lib/project-setup/types").FileTemplate[] {
  const rel = frontendRelPrefix(config);

  return [
    {
      relativePath: `${rel}src/lib/stores/useCounterStore.ts`,
      content: zustandCounterStoreContent(),
    },
    zustandNextCounterFile(rel, config.styling),
    {
      relativePath: `${rel}src/app/layout.tsx`,
      writePhase: "post",
      content: buildNextRootLayout(config, "{children}"),
    },
    nextFontCssFile(rel),
    {
      relativePath: `${rel}src/app/page.tsx`,
      writePhase: "post",
      content: nextHomePageContent(config, "@/lib/features/counter/Counter"),
    },
  ];
}

export const zustandNextModule: StackModule = {
  id: "state-zustand-next",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) &&
    c.frontendFramework === "nextjs" &&
    c.stateManagement === "zustand",
  checklist: () => ["Zustand counter store and demo Counter component (App Router)"],
  dependencies: () => ["zustand"],
  files: (config) => zustandNextSourceFiles(config),
  commands: (config, root) => [zustandInstallCommand(config, root)],
};

/**
 * React Context + useReducer - https://react.dev/learn/scaling-up-with-reducer-and-context
 * Separate state/dispatch contexts so dispatch-only consumers avoid re-renders.
 */
function contextCounterReducerContent(): string {
  return `export type CounterState = {
  count: number;
};

export type CounterAction =
  | { type: "incremented" }
  | { type: "decremented" };

export const initialCounterState: CounterState = {
  count: 0,
};

export function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "incremented":
      return { count: state.count + 1 };
    case "decremented":
      return { count: state.count - 1 };
    default:
      throw new Error("Unknown action");
  }
}
`;
}

function contextProviderContent(): string {
  return `import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  counterReducer,
  initialCounterState,
  type CounterAction,
  type CounterState,
} from "./counterReducer";

const CounterStateContext = createContext<CounterState | null>(null);
const CounterDispatchContext = createContext<Dispatch<CounterAction> | null>(null);

export function CounterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(counterReducer, initialCounterState);

  return (
    <CounterStateContext.Provider value={state}>
      <CounterDispatchContext.Provider value={dispatch}>
        {children}
      </CounterDispatchContext.Provider>
    </CounterStateContext.Provider>
  );
}

export function useCounterState() {
  const context = useContext(CounterStateContext);
  if (context === null) {
    throw new Error("useCounterState must be used within a CounterProvider");
  }
  return context;
}

export function useCounterDispatch() {
  const context = useContext(CounterDispatchContext);
  if (context === null) {
    throw new Error("useCounterDispatch must be used within a CounterProvider");
  }
  return context;
}
`;
}

function contextCounterUi(styling: ProjectSetupConfig["styling"]): {
  shadcnImport: string;
  muiImport: string;
  ui: string;
} {
  return counterDemoUi(
    styling,
    'onClick={() => dispatch({ type: "incremented" })}',
    'onClick={() => dispatch({ type: "decremented" })}',
  );
}

function contextViteCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const { shadcnImport, muiImport, ui } = contextCounterUi(styling);

  return {
    relativePath: `${rel}src/features/counter/Counter.tsx`,
    content: `import {
  useCounterDispatch,
  useCounterState,
} from "../../context/counter/CounterContext";
${shadcnImport}${muiImport}
export function Counter() {
  const { count } = useCounterState();
  const dispatch = useCounterDispatch();

  return (
    ${ui}
  );
}
`,
  };
}

function contextViteSourceFiles(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/context/counter/counterReducer.ts`,
      content: contextCounterReducerContent(),
    },
    {
      relativePath: `${rel}src/context/counter/CounterContext.tsx`,
      content: contextProviderContent(),
    },
    contextViteCounterFile(rel, styling),
  ];
}

export const contextViteModule: StackModule = {
  id: "state-context-vite",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) &&
    c.frontendFramework === "react" &&
    c.stateManagement === "context",
  checklist: () => [
    "React Context + useReducer provider, typed hooks, and counter demo wired in",
  ],
  dependencies: () => [],
  files: (config) => {
    const rel = frontendRelPrefix(config);
    return [
      ...contextViteSourceFiles(rel, config.styling),
      {
        relativePath: `${rel}src/main.tsx`,
        writePhase: "post",
        content: buildViteMainEntry(config),
      },
      {
        relativePath: `${rel}src/App.tsx`,
        writePhase: "post",
        content: viteDashboardAppContent(config, "./features/counter/Counter"),
      },
    ];
  },
  commands: () => [],
};

function contextNextCounterFile(
  rel: string,
  styling: ProjectSetupConfig["styling"]
): import("@/lib/project-setup/types").FileTemplate {
  const { shadcnImport, muiImport, ui } = contextCounterUi(styling);

  return {
    relativePath: `${rel}src/lib/features/counter/Counter.tsx`,
    content: `"use client";

import {
  useCounterDispatch,
  useCounterState,
} from "@/lib/context/counter/CounterProvider";
${shadcnImport}${muiImport}
export function Counter() {
  const { count } = useCounterState();
  const dispatch = useCounterDispatch();

  return (
    ${ui}
  );
}
`,
  };
}

function contextNextSourceFiles(config: ProjectSetupConfig): import("@/lib/project-setup/types").FileTemplate[] {
  const rel = frontendRelPrefix(config);

  return [
    {
      relativePath: `${rel}src/lib/context/counter/counterReducer.ts`,
      content: contextCounterReducerContent(),
    },
    {
      relativePath: `${rel}src/lib/context/counter/CounterProvider.tsx`,
      content: `"use client";

${contextProviderContent()}`,
    },
    contextNextCounterFile(rel, config.styling),
    {
      relativePath: `${rel}src/app/layout.tsx`,
      writePhase: "post",
      content: buildNextRootLayout(config, "{children}"),
    },
    nextFontCssFile(rel),
    {
      relativePath: `${rel}src/app/page.tsx`,
      writePhase: "post",
      content: nextHomePageContent(config, "@/lib/features/counter/Counter"),
    },
  ];
}

export const contextNextModule: StackModule = {
  id: "state-context-next",
  appliesTo: (c) =>
    scopeIncludesFrontend(c) &&
    c.frontendFramework === "nextjs" &&
    c.stateManagement === "context",
  checklist: () => [
    "React Context + useReducer CounterProvider, typed hooks, and counter demo (App Router)",
  ],
  dependencies: () => [],
  files: (config) => contextNextSourceFiles(config),
  commands: () => [],
};