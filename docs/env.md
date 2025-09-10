# Environment Variables

The application relies on environment variables for configuration. Copy the [`.env.example`](../.env.example) file to `.env` and adjust the values for your environment.

## Setup

1. `cp .env.example .env`
2. Fill in the values marked as `changeme` or placeholders.
3. **Never commit the `.env` file**. Keep secrets out of version control.

## Variables

| Variable | Description | Example |
| --- | --- | --- |
| `NODE_ENV` | Node.js runtime environment | `development` |
| `LOG_LEVEL` | Logging verbosity level | `info` |
| `REDIS_URL` | Connection string for Redis broker | `redis://localhost:6379` |
| `OMNI_STREAM_MESSAGES` | Stream name for incoming messages | `omni.messages` |
| `OMNI_STREAM_OUTBOX` | Stream name for outgoing messages | `omni.outbox` |
| `OMNI_GROUP` | Consumer group used by Omni workers | `omni-core` |
| `OMNI_BLOCK_MS` | Block timeout when reading streams (ms) | `5000` |
| `OMNI_DISPATCH_POLL_MS` | Poll interval for dispatching messages (ms) | `250` |
| `OMNI_DLQ_STREAM` | Dead letter queue stream name | `omni.dlq` |
| `MCP_WHATSAPP_URL` | WebSocket endpoint for WhatsApp MCP | `ws://localhost:8080` |
| `MCP_TOKEN` | Token for authenticating with the MCP | `changeme` |
| `WEB_BASE_URL` | Base URL for the web application | `http://localhost:3000` |
| `COMMIT_SHA` | Commit identifier used in logs and telemetry | `dev` |
| `TELEMETRY_TRACE` | Enables tracing when set to `on` | `on` |
| `AUTH_SECRET` | Secret used by Auth.js for session encryption | `your-random-secret-here` |
| `POSTGRES_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/ai_ysh` |
| `BLOB_READ_WRITE_TOKEN` | Token for S3-compatible blob storage | `minioadmin:minioadmin@localhost:9000/ai-ysh` |
| `AI_GATEWAY_API_KEY` | API key for the AI Gateway or `local` for Ollama | `local` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key for map features | `your-google-maps-key` |

## Security Notes

- Rotate tokens and secrets regularly.
- Use separate credentials for development and production.
- When deploying, store variables in your platform's secret manager (e.g., Vercel, Docker secrets).
