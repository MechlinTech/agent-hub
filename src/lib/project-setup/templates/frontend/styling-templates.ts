import type { FileTemplate, ProjectSetupConfig } from "@/lib/project-setup/types";
import { installLatestArgs } from "@/lib/project-setup/templates/package-latest";
import { frontendRelPrefix } from "@/lib/project-setup/templates/shared";

export function usesMui(config: ProjectSetupConfig): boolean {
  return config.styling === "mui";
}

/** True when create-next-app / Vite scaffolds include Tailwind CSS. */
export function usesTailwindStyling(config: ProjectSetupConfig): boolean {
  return config.styling === "tailwind" || config.styling === "shadcn";
}

export function viteMuiThemeFiles(rel: string): FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/theme/theme.ts`,
      content: `import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  typography: {
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});
`,
    },
    {
      relativePath: `${rel}src/theme/ThemeProvider.tsx`,
      content: `import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
`,
    },
  ];
}

export function viteMuiIndexCss(): string {
  return `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

body {
  margin: 0;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
}

export function muiNextThemeFiles(rel: string): FileTemplate[] {
  return [
    {
      relativePath: `${rel}src/theme/theme.ts`,
      content: `"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});
`,
    },
    {
      relativePath: `${rel}src/app/ThemeRegistry.tsx`,
      content: `"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme/theme";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
`,
    },
    {
      relativePath: `${rel}src/app/globals.css`,
      writePhase: "post",
      content: `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

html,
body {
  max-width: 100vw;
  min-height: 100%;
}

body {
  margin: 0;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`,
    },
  ];
}

export function muiNextLayoutInner(config: ProjectSetupConfig, childrenExpr: string): string {
  let inner = childrenExpr;
  if (config.stateManagement === "context") {
    inner = `<CounterProvider>${inner}</CounterProvider>`;
  }
  if (config.stateManagement === "redux") {
    inner = `<StoreProvider>${inner}</StoreProvider>`;
  }
  if (!usesTailwindStyling(config)) {
    inner = `<ThemeRegistry>${inner}</ThemeRegistry>`;
  }
  return inner;
}

export function muiNextLayoutImports(config: ProjectSetupConfig): string {
  const lines: string[] = [];
  if (config.stateManagement === "redux") {
    lines.push(`import StoreProvider from "./StoreProvider";`);
  }
  if (config.stateManagement === "context") {
    lines.push(`import { CounterProvider } from "@/lib/context/counter/CounterProvider";`);
  }
  if (!usesTailwindStyling(config)) {
    lines.push(`import ThemeRegistry from "./ThemeRegistry";`);
  }
  return lines.length ? `${lines.join("\n")}\n` : "";
}

export function muiInstallArgs(): string[] {
  return installLatestArgs(
    "@mui/material",
    "@mui/material-nextjs",
    "@emotion/react",
    "@emotion/styled",
  );
}

export function nextPageCenterShell(config: ProjectSetupConfig, body: string): string {
  if (!usesTailwindStyling(config)) {
    return `<Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        p: 4,
      }}
    >
      ${body}
    </Box>`;
  }
  return `<main className="flex min-h-svh flex-col items-center justify-center gap-4 p-8">
      ${body}
    </main>`;
}

export function stateManagementLabel(config: ProjectSetupConfig): string {
  switch (config.stateManagement) {
    case "redux":
      return "Redux Toolkit";
    case "zustand":
      return "Zustand";
    case "context":
      return "React Context + useReducer";
    default:
      return "State management";
  }
}

export function dashboardMuiImports(): string {
  return `import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
`;
}

/** Weekly activity demo data - heights are pixel values within a 180px chart area. */
type ActivityBar = {
  label: string;
  height: number;
  value: number;
  highlight?: boolean;
};

const ACTIVITY_WEEKLY_BARS: ActivityBar[] = [
  { label: "Mon", height: 81, value: 102 },
  { label: "Tue", height: 112, value: 140 },
  { label: "Wed", height: 158, value: 200, highlight: true },
  { label: "Thu", height: 97, value: 122 },
  { label: "Fri", height: 126, value: 158 },
  { label: "Sat", height: 68, value: 85 },
  { label: "Sun", height: 76, value: 95 },
];

/** Inter-based font stack for Tailwind / ShadCN (softer than default serif fallback). */
export function viteInterIndexCss(): string {
  return `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
@import "tailwindcss";

body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;
}

export function nextFontCssFile(rel: string): FileTemplate {
  return {
    relativePath: `${rel}src/app/agent-hub-fonts.css`,
    writePhase: "post",
    content: `body {
  font-family: var(--font-sans, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`,
  };
}

/** Inter font stack for Vite - kept separate from index.css so shadcn init CSS vars are preserved. */
export function viteInterFontsCssFile(rel: string): FileTemplate {
  return {
    relativePath: `${rel}src/agent-hub-fonts.css`,
    writePhase: "post",
    content: `@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");

body {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`,
  };
}

export function buildViteMainEntry(config: ProjectSetupConfig): string {
  const themeImport =
    config.styling === "mui" ? `import AppThemeProvider from "./theme/ThemeProvider";\n` : "";
  const themeOpen = config.styling === "mui" ? "    <AppThemeProvider>\n" : "";
  const themeClose = config.styling === "mui" ? "    </AppThemeProvider>\n" : "";

  const cssImportLines = ['import "./index.css";'];
  if (config.styling === "shadcn") {
    cssImportLines.push('import "./agent-hub-fonts.css";');
  }
  const cssImports = cssImportLines.join("\n");

  const state = config.stateManagement;
  const counterProviderImport =
    state === "context"
      ? `import { CounterProvider } from "./context/counter/CounterContext";\n`
      : "";
  const counterOpen = state === "context" ? "      <CounterProvider>\n" : "";
  const counterClose = state === "context" ? "      </CounterProvider>\n" : "";

  const rootError =
    'Root element with ID \'root\' was not found in the document. Ensure there is a corresponding HTML element with the ID \'root\' in your HTML file.';

  if (state === "redux") {
    return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
${cssImports}
import App from "./App.tsx";
import { store } from "./app/store";
${themeImport}
const container = document.getElementById("root");
if (!container) {
  throw new Error("${rootError}");
}

createRoot(container).render(
  <StrictMode>
${themeOpen}    <Provider store={store}>
      <App />
    </Provider>
${themeClose}  </StrictMode>,
);
`;
  }

  return `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
${counterProviderImport}${cssImports}
import App from "./App.tsx";
${themeImport}
const container = document.getElementById("root");
if (!container) {
  throw new Error("${rootError}");
}

createRoot(container).render(
  <StrictMode>
${themeOpen}${counterOpen}    <App />
${counterClose}${themeClose}  </StrictMode>,
);
`;
}

function dashboardActivityBarTailwind(bar: ActivityBar): string {
  const barColor = bar.highlight
    ? "rounded-t-lg bg-blue-600 shadow-sm transition-colors group-hover:bg-blue-500"
    : bar.height < 80
      ? "rounded-t-lg bg-blue-100 transition-colors group-hover:bg-blue-200"
      : "rounded-t-lg bg-blue-200 transition-colors group-hover:bg-blue-300";
  const labelClass = bar.highlight
    ? "text-xs font-medium text-slate-700"
    : "text-xs text-slate-400";

  return `<div className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100">
                    ${bar.value}
                  </div>
                  <div className="w-full max-w-10 ${barColor}" style={{ height: ${bar.height} }} />
                  <span className="${labelClass}">${bar.label}</span>
                </div>`;
}

function dashboardActivityChartTailwind(): string {
  const bars = ACTIVITY_WEEKLY_BARS.map(dashboardActivityBarTailwind).join("\n                ");

  return `<div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Activity Overview</h2>
                  <p className="mt-1 text-sm text-slate-500">Weekly engagement snapshot</p>
                </div>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Week 1</span>
              </div>
              <div className="flex h-[180px] items-end gap-2 px-1 pt-6">
                ${bars}
              </div>
            </div>`;
}

function muiActivityBarColumn(bar: ActivityBar): string {
  const barColor = bar.highlight ? "#2563eb" : bar.height < 80 ? "#dbeafe" : "#bfdbfe";
  const hoverColor = bar.highlight ? "#3b82f6" : bar.height < 80 ? "#bfdbfe" : "#93c5fd";

  return `<Box
                    sx={{
                      flex: 1,
                      height: "100%",
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      gap: 1,
                      position: "relative",
                      "&:hover .activity-bar-tooltip": { opacity: 1 },
                      "&:hover .activity-bar-fill": { bgcolor: "${hoverColor}" },
                    }}
                  >
                    <Box
                      className="activity-bar-tooltip"
                      sx={{
                        position: "absolute",
                        bottom: "100%",
                        mb: 1,
                        opacity: 0,
                        transition: "opacity 150ms ease",
                        bgcolor: "#0f172a",
                        color: "#fff",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: 12,
                        fontWeight: 500,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ${bar.value}
                    </Box>
                    <Box
                      className="activity-bar-fill"
                      sx={{
                        width: "100%",
                        maxWidth: 28,
                        height: ${bar.height},
                        borderRadius: "8px 8px 0 0",
                        bgcolor: "${barColor}",
                        boxShadow: ${bar.highlight ? 1 : 0},
                        transition: "background-color 150ms ease",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontWeight: ${bar.highlight ? 600 : 400} }}>
                      ${bar.label}
                    </Typography>
                  </Box>`;
}

function dashboardActivityChartMui(): string {
  const bars = ACTIVITY_WEEKLY_BARS.map(muiActivityBarColumn).join("\n                ");

  return `<Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "#fff" }}>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Activity Overview
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Weekly engagement snapshot
                  </Typography>
                </Box>
                <Chip label="Week 1" size="small" variant="outlined" sx={{ borderColor: "divider" }} />
              </Box>
              <Box
                sx={{
                  height: 180,
                  pt: 3,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  gap: 1,
                  px: 0.5,
                }}
              >
                ${bars}
              </Box>
            </Paper>`;
}

function projectSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "app";
}

function dashboardStatCardsTailwind(): string {
  return `<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex min-h-[168px] flex-col rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-md sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-white/15 p-2.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                  </svg>
                </div>
                <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-100">+ 4.7%</span>
              </div>
              <p className="mt-5 text-sm font-medium text-blue-100">Active Users</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">128</p>
              <p className="mt-auto pt-4 text-xs text-blue-200/80">Last update · just now</p>
            </div>
            <div className="flex min-h-[168px] flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">+ 6.2%</span>
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Healthy</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">92</p>
              <p className="mt-auto pt-4 text-xs text-slate-400">Last update · 12:00</p>
            </div>
            <div className="flex min-h-[168px] flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">- 2.1%</span>
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Needs Review</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">27</p>
              <p className="mt-auto pt-4 text-xs text-slate-400">Last update · 12:00</p>
            </div>
            <div className="flex min-h-[168px] flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">+ 1.4%</span>
              </div>
              <p className="mt-5 text-sm font-medium text-slate-500">Critical</p>
              <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">9</p>
              <p className="mt-auto pt-4 text-xs text-slate-400">Last update · 12:00</p>
            </div>
          </section>`;
}

function muiStatCardIcon(pathD: string, iconBg: string, iconColor: string): string {
  return `<Box sx={{ borderRadius: 2.5, bgcolor: "${iconBg}", color: "${iconColor}", p: 1.25, display: "inline-flex" }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="${pathD}" />
                  </svg>
                </Box>`;
}

function muiStatCard(options: {
  label: string;
  value: string;
  updated: string;
  trend: string;
  trendBg: string;
  trendColor: string;
  iconBg: string;
  iconColor: string;
  iconPath: string;
  primary?: boolean;
}): string {
  const paperSx = options.primary
    ? `gridColumn: { xs: "span 1", sm: "span 2", lg: "span 1" }, p: 2.5, borderRadius: 3, color: "#fff", background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)", minHeight: 168, display: "flex", flexDirection: "column", boxShadow: 2`
    : `p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "#fff", minHeight: 168, display: "flex", flexDirection: "column"`;
  const labelSx = options.primary
    ? `opacity: 0.9, mt: 2.5, fontWeight: 500, fontSize: 14`
    : `mt: 2.5, fontWeight: 500, fontSize: 14, color: "text.secondary"`;
  const updatedSx = options.primary
    ? `opacity: 0.8, pt: 2, mt: "auto", display: "block"`
    : `pt: 2, mt: "auto", display: "block", color: "text.secondary"`;
  const badgeBg = options.primary ? "rgba(52, 211, 153, 0.2)" : options.trendBg;
  const badgeColor = options.primary ? "#d1fae5" : options.trendColor;

  return `<Paper elevation={0} sx={{ ${paperSx} }}>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
                ${muiStatCardIcon(options.iconPath, options.iconBg, options.iconColor)}
                <Box sx={{ borderRadius: 999, px: 1.25, py: 0.5, bgcolor: "${badgeBg}", color: "${badgeColor}", fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>
                  ${options.trend}
                </Box>
              </Box>
              <Typography variant="body2" sx={{ ${labelSx} }}>
                ${options.label}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, letterSpacing: "-0.02em" }}>
                ${options.value}
              </Typography>
              <Typography variant="caption" sx={{ ${updatedSx} }}>
                Last update · ${options.updated}
              </Typography>
            </Paper>`;
}

function dashboardStatCardsMui(): string {
  const usersIcon =
    "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z";
  const checkIcon = "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";
  const warnIcon =
    "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z";
  const alertIcon = "M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z";

  return `<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
            ${muiStatCard({ label: "Active Users", value: "128", updated: "just now", trend: "+ 4.7%", trendBg: "#ecfdf5", trendColor: "#059669", iconBg: "rgba(255,255,255,0.15)", iconColor: "#fff", iconPath: usersIcon, primary: true })}
            ${muiStatCard({ label: "Healthy", value: "92", updated: "12:00", trend: "+ 6.2%", trendBg: "#ecfdf5", trendColor: "#059669", iconBg: "#ecfdf5", iconColor: "#059669", iconPath: checkIcon })}
            ${muiStatCard({ label: "Needs Review", value: "27", updated: "12:00", trend: "- 2.1%", trendBg: "#fff1f2", trendColor: "#e11d48", iconBg: "#fffbeb", iconColor: "#d97706", iconPath: warnIcon })}
            ${muiStatCard({ label: "Critical", value: "9", updated: "12:00", trend: "+ 1.4%", trendBg: "#ecfdf5", trendColor: "#059669", iconBg: "#fff1f2", iconColor: "#e11d48", iconPath: alertIcon })}
          </Box>`;
}

function dashboardAlertsTailwind(): string {
  return `<div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
            <h2 className="text-base font-semibold text-slate-900">Today's Alerts</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">09:00</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700"><span className="font-semibold text-slate-900">Store connected</span> - counter slice is ready to test.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">08:30</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700"><span className="font-semibold text-slate-900">Dashboard ready</span> - shell generated by AgentHub setup.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-400">08:00</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-slate-700"><span className="font-semibold text-slate-900">Setup complete</span> - all starter modules installed.</p>
                </div>
              </li>
            </ul>
          </div>`;
}

function muiAlertItem(time: string, title: string, body: string, iconBg: string, iconColor: string, iconPath: string): string {
  return `<Box sx={{ display: "flex", flexDirection: "row", gap: 1.5 }}>
              <Box sx={{ mt: 0.25, width: 36, height: 36, borderRadius: "50%", bgcolor: "${iconBg}", color: "${iconColor}", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="${iconPath}" />
                </svg>
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>${time}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                  <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>${title}</Box>
                  {" - "}${body}
                </Typography>
              </Box>
            </Box>`;
}

function dashboardAlertsMui(): string {
  const warnIcon =
    "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z";
  const bellIcon =
    "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0";
  const checkIcon = "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z";

  return `<Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "#fff" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Today's Alerts
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              ${muiAlertItem("09:00", "Store connected", "counter slice is ready to test.", "#fff1f2", "#e11d48", warnIcon)}
              ${muiAlertItem("08:30", "Dashboard ready", "shell generated by AgentHub setup.", "#eff6ff", "#2563eb", bellIcon)}
              ${muiAlertItem("08:00", "Setup complete", "all starter modules installed.", "#ecfdf5", "#059669", checkIcon)}
            </Box>
          </Paper>`;
}

function dashboardQuickTipsTailwind(): string {
  return `<div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/60">
            <h2 className="text-base font-semibold text-slate-900">Quick Tips</h2>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <p className="text-sm font-semibold text-slate-800">Wire your API</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Connect real data to the stat cards and activity table.</p>
              </li>
              <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <p className="text-sm font-semibold text-slate-800">Extend the store</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Add slices or selectors alongside the demo counter.</p>
              </li>
              <li className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                <p className="text-sm font-semibold text-slate-800">Customize navigation</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">Replace placeholder nav items with your app routes.</p>
              </li>
            </ul>
          </div>`;
}

function dashboardQuickTipsMui(): string {
  return `<Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "#fff" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Quick Tips
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
              <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: 1, borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Wire your API</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                  Connect real data to the stat cards and activity table.
                </Typography>
              </Box>
              <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: 1, borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Extend the store</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                  Add slices or selectors alongside the demo counter.
                </Typography>
              </Box>
              <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: "#f8fafc", border: 1, borderColor: "divider" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Customize navigation</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5, lineHeight: 1.5 }}>
                  Replace placeholder nav items with your app routes.
                </Typography>
              </Box>
            </Box>
          </Paper>`;
}

function dashboardNavUserSection(config: ProjectSetupConfig, topBar?: string): {
  tailwind: string;
  mui: string;
} {
  if (topBar) {
    return { tailwind: topBar, mui: topBar };
  }

  const slug = projectSlug(config.projectName);
  return {
    tailwind: `<div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">Demo User</p>
            <p className="text-xs text-slate-500">admin@${slug}.app</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-semibold text-white shadow-sm">
            DU
          </div>
        </div>`,
    mui: `<Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Demo User
            </Typography>
            <Typography variant="caption" color="text.secondary">
              admin@${slug}.app
            </Typography>
          </Box>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: 14 }}>
            DU
          </Avatar>
        </Box>`,
  };
}

function dashboardTailwindShell(
  config: ProjectSetupConfig,
  counterJsx: string,
  topBar?: string,
): string {
  const title = config.projectName;
  const stateLabel = stateManagementLabel(config);
  const initial = title.charAt(0).toUpperCase() || "P";
  const navUser = dashboardNavUserSection(config, topBar);

  return `<div className="min-h-svh bg-[#f4f6f8]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                ${initial}
              </div>
              <span className="truncate text-base font-semibold text-slate-900">${title}</span>
            </div>
            <nav className="hidden items-center gap-1 md:flex">
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600">Overview</span>
              <span className="rounded-lg px-3 py-2 text-sm text-slate-500">Analytics</span>
              <span className="rounded-lg px-3 py-2 text-sm text-slate-500">Reports</span>
              <span className="rounded-lg px-3 py-2 text-sm text-slate-500">Settings</span>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="hidden rounded-lg border border-slate-200 bg-white p-2 text-slate-500 shadow-sm sm:inline-flex"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-500 sm:px-4"
            >
              Get Started
            </button>
            ${navUser.tailwind}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px] sm:px-6">
        <main className="min-w-0 space-y-6">
          ${dashboardStatCardsTailwind()}

          <section className="grid gap-6 lg:grid-cols-2">
            ${dashboardActivityChartTailwind()}

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">State Management</h2>
                  <p className="mt-1 text-sm text-slate-500">${stateLabel} live counter</p>
                </div>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Live</span>
              </div>
              <div className="flex flex-col items-center py-2">
                <div className="relative flex h-56 w-56 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-[14px] border-emerald-100" />
                  <div className="absolute inset-5 rounded-full border-[14px] border-amber-100" />
                  <div className="absolute inset-10 rounded-full border-[14px] border-rose-100" />
                  <div className="relative z-10 flex flex-col items-center">
                    ${counterJsx}
                  </div>
                </div>
                <div className="mt-4 grid w-full max-w-xs grid-cols-3 gap-2 text-center text-xs text-slate-500">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Stable
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Watch
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Alert
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-sm text-slate-500">Sample records - replace with your data source</p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">All Statuses</span>
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600">This Week</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Updated</th>
                    <th className="px-6 py-3 font-medium">Progress</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-900">Sarah Johnson</td>
                    <td className="px-6 py-4 text-slate-500">Today, 09:12</td>
                    <td className="px-6 py-4">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[72%] rounded-full bg-blue-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Stable</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-900">Michael Chen</td>
                    <td className="px-6 py-4 text-slate-500">Today, 08:45</td>
                    <td className="px-6 py-4">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[48%] rounded-full bg-blue-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">Attention</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="px-6 py-4 font-medium text-slate-900">Emily Rodriguez</td>
                    <td className="px-6 py-4 text-slate-500">Yesterday, 16:30</td>
                    <td className="px-6 py-4">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full w-[91%] rounded-full bg-blue-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">Risk</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>

        <aside className="space-y-4 lg:sticky lg:top-[4.5rem] lg:self-start">
          ${dashboardAlertsTailwind()}
          ${dashboardQuickTipsTailwind()}

          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-md">
            <p className="text-sm font-semibold">Ready to build?</p>
            <p className="mt-2 text-sm text-blue-100">
              This dashboard is a starting point. Swap placeholders with your product features.
            </p>
            <button
              type="button"
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50"
            >
              Explore Docs
            </button>
          </div>
        </aside>
      </div>
    </div>`;
}

function dashboardMuiShell(
  config: ProjectSetupConfig,
  counterJsx: string,
  topBar?: string,
): string {
  const title = config.projectName;
  const stateLabel = stateManagementLabel(config);
  const initial = title.charAt(0).toUpperCase() || "P";
  const navUser = dashboardNavUserSection(config, topBar);

  return `<Box sx={{ minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <Paper
        elevation={0}
        square
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            maxWidth: 1440,
            mx: "auto",
            px: { xs: 2, sm: 3 },
            py: 1.5,
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 3, minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.25, minWidth: 0 }}>
              <Avatar sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: "#2563eb", fontSize: 14, fontWeight: 700 }}>
                ${initial}
              </Avatar>
              <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
                ${title}
              </Typography>
            </Box>
            <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "row", gap: 0.5 }}>
              <Chip label="Overview" size="small" sx={{ bgcolor: "#eff6ff", color: "#2563eb", fontWeight: 600, border: "none" }} />
              <Chip label="Analytics" size="small" variant="outlined" sx={{ borderColor: "transparent", color: "text.secondary" }} />
              <Chip label="Reports" size="small" variant="outlined" sx={{ borderColor: "transparent", color: "text.secondary" }} />
              <Chip label="Settings" size="small" variant="outlined" sx={{ borderColor: "transparent", color: "text.secondary" }} />
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
            <Button variant="contained" size="small" disableElevation sx={{ bgcolor: "#2563eb", textTransform: "none" }}>
              Get Started
            </Button>
            ${navUser.mui}
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{
          maxWidth: 1440,
          mx: "auto",
          px: { xs: 2, sm: 3 },
          py: 3,
          display: "grid",
          gridTemplateColumns: { lg: "minmax(0, 1fr) 300px" },
          gap: 3,
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
          ${dashboardStatCardsMui()}

          <Box sx={{ display: "grid", gridTemplateColumns: { lg: "repeat(2, 1fr)" }, gap: 3 }}>
            ${dashboardActivityChartMui()}

            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: "divider", bgcolor: "#fff" }}>
              <Box sx={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", mb: 1 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    State Management
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    ${stateLabel} live counter
                  </Typography>
                </Box>
                <Chip label="Live" size="small" variant="outlined" sx={{ borderColor: "divider" }} />
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 1 }}>
                <Box sx={{ position: "relative", width: 224, height: 224, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", border: "14px solid #d1fae5" }} />
                  <Box sx={{ position: "absolute", inset: 20, borderRadius: "50%", border: "14px solid #fef3c7" }} />
                  <Box sx={{ position: "absolute", inset: 40, borderRadius: "50%", border: "14px solid #ffe4e6" }} />
                  <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                    ${counterJsx}
                  </Box>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "row", gap: 2, mt: 2, width: "100%", maxWidth: 280, justifyContent: "center" }}>
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10b981" }} />
                    <Typography variant="caption" color="text.secondary">Stable</Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#fbbf24" }} />
                    <Typography variant="caption" color="text.secondary">Watch</Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#f43f5e" }} />
                    <Typography variant="caption" color="text.secondary">Alert</Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>

          <Paper elevation={0} sx={{ borderRadius: 3, border: 1, borderColor: "divider", overflow: "hidden", bgcolor: "#fff" }}>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sample records - replace with your data source
              </Typography>
            </Box>
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>Updated</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>Progress</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Sarah Johnson</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Today, 09:12</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <LinearProgress variant="determinate" value={72} sx={{ height: 8, borderRadius: 999, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: "#2563eb", borderRadius: 999 } }} />
                    </TableCell>
                    <TableCell>
                      <Chip label="Stable" size="small" sx={{ bgcolor: "#ecfdf5", color: "#047857", border: "none" }} />
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Michael Chen</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Today, 08:45</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <LinearProgress variant="determinate" value={48} sx={{ height: 8, borderRadius: 999, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: "#2563eb", borderRadius: 999 } }} />
                    </TableCell>
                    <TableCell>
                      <Chip label="Attention" size="small" sx={{ bgcolor: "#fffbeb", color: "#b45309", border: "none" }} />
                    </TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell sx={{ fontWeight: 600 }}>Emily Rodriguez</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>Yesterday, 16:30</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <LinearProgress variant="determinate" value={91} sx={{ height: 8, borderRadius: 999, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: "#2563eb", borderRadius: 999 } }} />
                    </TableCell>
                    <TableCell>
                      <Chip label="Risk" size="small" sx={{ bgcolor: "#fff1f2", color: "#be123c", border: "none" }} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, position: { lg: "sticky" }, top: 72, alignSelf: "start" }}>
          ${dashboardAlertsMui()}
          ${dashboardQuickTipsMui()}
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              color: "#fff",
              background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Ready to build?
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
              Swap placeholders with your product features.
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{ mt: 2, bgcolor: "#fff", color: "#2563eb", textTransform: "none", "&:hover": { bgcolor: "#eff6ff" } }}
            >
              Explore Docs
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>`;
}

/** Starter dashboard with the state-management counter featured at the center. */
export function frontendDashboardShell(
  config: ProjectSetupConfig,
  counterJsx: string,
  options?: { topBarJsx?: string },
): string {
  const topBar = options?.topBarJsx;

  if (!usesTailwindStyling(config)) {
    return dashboardMuiShell(config, counterJsx, topBar);
  }

  return dashboardTailwindShell(config, counterJsx, topBar);
}

export function viteDashboardAppContent(
  config: ProjectSetupConfig,
  counterImport: string,
): string {
  const muiImport = !usesTailwindStyling(config) ? dashboardMuiImports() : "";
  return `${muiImport}import { Counter } from "${counterImport}";

export default function App() {
  return (
    ${frontendDashboardShell(config, "<Counter />")}
  );
}
`;
}

export function nextHomePageContent(
  config: ProjectSetupConfig,
  counterImport: string,
): string {
  const clientDirective = !usesTailwindStyling(config) ? '"use client";\n\n' : "";
  const muiImport = !usesTailwindStyling(config) ? dashboardMuiImports() : "";
  return `${clientDirective}${muiImport}import { Counter } from "${counterImport}";

export default function Home() {
  return (
    ${frontendDashboardShell(config, "<Counter />")}
  );
}
`;
}

export function buildNextRootLayout(
  config: ProjectSetupConfig,
  innerChildrenExpr: string,
  additionalImports = "",
): string {
  const extraImports = `${muiNextLayoutImports(config)}${additionalImports ? `${additionalImports}\n` : ""}`;
  const inner = muiNextLayoutInner(config, innerChildrenExpr);
  const usesInter = usesTailwindStyling(config) || config.styling === "mui";
  const bodyClass = usesInter
    ? "`${inter.variable} font-sans antialiased`"
    : "`${geistSans.variable} ${geistMono.variable} antialiased`";
  const fontImport = usesInter
    ? `import { Inter } from "next/font/google";
import "./agent-hub-fonts.css";
`
    : "";
  const fontDecl = usesInter
    ? `const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
`
    : `const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
`;
  const geistImport = usesInter
    ? ""
    : `import { Geist, Geist_Mono } from "next/font/google";
`;

  return `import type { Metadata } from "next";
${geistImport}${fontImport}import "./globals.css";
${extraImports}${fontDecl}
export const metadata: Metadata = {
  title: "${config.projectName}",
  description: "Generated by AgentHub Dev Scaffold Agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={${bodyClass}}>
        ${inner}
      </body>
    </html>
  );
}
`;
}
