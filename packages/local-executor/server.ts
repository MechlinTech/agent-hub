import http from "http";
import { URL } from "url";
import {
  EXECUTOR_DEFAULT_PORT,
} from "../../src/lib/project-setup/defaults";
import { getAllowedCorsOrigins, getExecutorPort } from "../../src/lib/project-setup/env";
import {
  isPaired,
  pairExecutor,
  verifyBearerToken,
  extractBearerToken,
  isValidPairingToken,
} from "./pairing";
import {
  createExecutionId,
  previewPlan,
  runProjectGeneration,
} from "./orchestrator";
import { pickNativeFolder } from "./pick-folder";
import type { ExecutionLogEvent } from "../../src/lib/execution/execution-service";
import type { ProjectSetupConfig } from "../../src/lib/project-setup/types";

function resolveExecutorVersion(): string {
  const runtime =
    process.env.AGENTHUB_DESKTOP_VERSION?.trim() ||
    process.env.AGENTHUB_EXECUTOR_VERSION?.trim();
  if (runtime) return runtime.replace(/^v/i, "");
  return "unknown";
}

const VERSION = resolveExecutorVersion();
const MIN_UI_VERSION = "1.0.0";

interface ActiveExecution {
  events: ExecutionLogEvent[];
  listeners: Set<(event: ExecutionLogEvent) => void>;
  done: boolean;
  result?: unknown;
  error?: string;
}

const executions = new Map<string, ActiveExecution>();

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedCorsOrigins();
  const allowOrigin =
    origin && allowed.some((a) => origin === a || origin.startsWith(a.replace(/\/$/, "")))
      ? origin
      : allowed[0] ?? "http://localhost:3040";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  origin: string | null
) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...corsHeaders(origin),
  });
  res.end(JSON.stringify(body));
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

function pushEvent(executionId: string, event: ExecutionLogEvent) {
  const ex = executions.get(executionId);
  if (!ex) return;
  ex.events.push(event);
  ex.listeners.forEach((listener) => listener(event));
}

async function requireAuth(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  origin: string | null
): Promise<boolean> {
  const ok = await verifyBearerToken(req.headers.authorization ?? null);
  if (!ok) {
    sendJson(res, 401, { error: "Unauthorized — pair executor with a valid token" }, origin);
    return false;
  }
  return true;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin ?? null;
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);
  const pathname = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(origin));
    res.end();
    return;
  }

  if (req.method === "GET" && pathname === "/health") {
    const paired = await isPaired();
    sendJson(
      res,
      200,
      { ok: true, version: VERSION, minUiVersion: MIN_UI_VERSION, paired },
      origin
    );
    return;
  }

  if (req.method === "POST" && pathname === "/pair") {
    const bearer = extractBearerToken(req.headers.authorization ?? null);
    if (!bearer || !isValidPairingToken(bearer)) {
      sendJson(
        res,
        401,
        { error: "Authorization Bearer token required (generate in AgentHub Settings)" },
        origin
      );
      return;
    }
    try {
      const body = JSON.parse(await readBody(req)) as { token?: string };
      if (!body.token) {
        sendJson(res, 400, { error: "token required in body" }, origin);
        return;
      }
      if (body.token !== bearer) {
        sendJson(res, 400, { error: "Body token must match Authorization header" }, origin);
        return;
      }
      await pairExecutor(bearer);
      sendJson(res, 200, { ok: true, paired: true }, origin);
    } catch (e) {
      sendJson(res, 400, { error: e instanceof Error ? e.message : "Pair failed" }, origin);
    }
    return;
  }

  if (req.method === "POST" && pathname === "/pick-folder") {
    if (!(await requireAuth(req, res, origin))) return;
    try {
      let windowTitle: string | undefined;
      const rawBody = await readBody(req);
      if (rawBody.trim()) {
        const body = JSON.parse(rawBody) as { windowTitle?: string };
        windowTitle = body.windowTitle?.trim() || undefined;
      }
      const picked = await pickNativeFolder({ windowTitle });
      if (!picked) {
        sendJson(res, 200, { cancelled: true }, origin);
        return;
      }
      sendJson(res, 200, { path: picked }, origin);
    } catch (e) {
      sendJson(res, 400, { error: e instanceof Error ? e.message : "Pick folder failed" }, origin);
    }
    return;
  }

  if (req.method === "POST" && pathname === "/preview") {
    if (!(await requireAuth(req, res, origin))) return;
    try {
      const body = JSON.parse(await readBody(req)) as { config?: ProjectSetupConfig };
      if (!body.config) {
        sendJson(res, 400, { error: "config required" }, origin);
        return;
      }
      const plan = previewPlan(body.config);
      sendJson(res, 200, { plan }, origin);
    } catch (e) {
      sendJson(res, 400, { error: e instanceof Error ? e.message : "Preview failed" }, origin);
    }
    return;
  }

  if (req.method === "POST" && pathname === "/execute") {
    if (!(await requireAuth(req, res, origin))) return;
    try {
      const body = JSON.parse(await readBody(req)) as {
        jobId?: string;
        config?: ProjectSetupConfig;
      };
      if (!body.config) {
        sendJson(res, 400, { error: "config required" }, origin);
        return;
      }
      const executionId = createExecutionId();
      const active: ActiveExecution = { events: [], listeners: new Set(), done: false };
      executions.set(executionId, active);

      sendJson(res, 202, { executionId, jobId: body.jobId ?? null }, origin);

      runProjectGeneration(body.config, {
        onEvent: (event) => pushEvent(executionId, event),
      })
        .then((result) => {
          active.done = true;
          active.result = result;
          pushEvent(executionId, { type: "done", success: true, message: "Completed" });
        })
        .catch((e) => {
          active.done = true;
          active.error = e instanceof Error ? e.message : "Failed";
          pushEvent(executionId, {
            type: "error",
            success: false,
            message: active.error,
          });
        });
    } catch (e) {
      sendJson(res, 400, { error: e instanceof Error ? e.message : "Execute failed" }, origin);
    }
    return;
  }

  const streamMatch = pathname.match(/^\/execute\/([^/]+)\/stream$/);
  if (req.method === "GET" && streamMatch) {
    if (!(await requireAuth(req, res, origin))) return;
    const executionId = streamMatch[1]!;
    const active = executions.get(executionId);
    if (!active) {
      sendJson(res, 404, { error: "Execution not found" }, origin);
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...corsHeaders(origin),
    });

    for (const event of active.events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    if (active.done) {
      res.write(
        `data: ${JSON.stringify({
          type: "complete",
          result: active.result ?? null,
          error: active.error ?? null,
        })}\n\n`
      );
      res.end();
      return;
    }

    const listener = (event: ExecutionLogEvent) => {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    active.listeners.add(listener);

    const interval = setInterval(() => {
      if (active.done) {
        res.write(
          `data: ${JSON.stringify({
            type: "complete",
            result: active.result ?? null,
            error: active.error ?? null,
          })}\n\n`
        );
        clearInterval(interval);
        active.listeners.delete(listener);
        res.end();
      }
    }, 500);

    req.on("close", () => {
      clearInterval(interval);
      active.listeners.delete(listener);
    });
    return;
  }

  sendJson(res, 404, { error: "Not found" }, origin);
});

const port = getExecutorPort() || EXECUTOR_DEFAULT_PORT;
server.listen(port, "127.0.0.1", () => {
  console.log(`AgentHub Local Executor v${VERSION} listening on http://127.0.0.1:${port}`);
});
