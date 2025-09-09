# REST API Service

Microservice exposing REST endpoints for conversation outputs.

The service implements an API-first workflow. The REST interface is
documented in [`openapi.yaml`](./openapi.yaml) and currently exposes a
single endpoint:

- `GET /journey/{phase}` – returns the input and output nodes associated
  with a given user journey phase.

## Development

```bash
pnpm start
```

The server listens on port `3001` by default.
