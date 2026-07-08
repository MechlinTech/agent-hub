# Project Setup Agent

The Project Setup Agent scaffolds projects on **your local machine** via the Local Executor.

## Development

Run both processes:

```bash
npm run dev:all
```

Or separately:

```bash
npm run dev        # UI on http://localhost:3040
npm run executor     # Local Executor on http://127.0.0.1:8787
```

## First-time setup

1. Open **Settings → Local Executor**
2. Start the executor (`npm run executor`)
3. Generate a pairing token and click **Pair executor**
4. Open **Agents → Project Setup → New Setup**

## Production (remote PC + tunnel)

```bash
npm run build && npm run start   # not npm run dev
npm run executor
```

Use PM2 with `ecosystem.config.js` to keep both processes running.

## Environment

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PROJECT_SETUP_ENABLED` | enabled | Set `false` to disable agent |
| `PROJECT_SETUP_ALLOWED_ROOTS` | *(unset — any path)* | Optional comma-separated allowlist; set only to restrict where projects may be created |
| `EXECUTOR_PORT` | `8787` | Local Executor port |
| `EXECUTOR_CORS_ORIGINS` | — | Extra allowed browser origins |

Projects are **never** stored in Supabase — only job metadata (config, logs, status).
