# LogAI Frontend

Angular 18 frontend for the GenAI-powered log analyzer and incident assistant.

## Local Development

```bash
npm install
npm start
```

Development API URL:

```text
http://localhost:8080/api
```

## Verification

```bash
npm run typecheck
npm run typecheck:spec
npm run test:ci
```

## Production Build

```bash
npm run build:prod
```

Production output:

```text
dist/log-analyzer-ui/browser
```

## Production API Routing

Production uses a relative API base URL:

```text
/api
```

For AWS S3 + CloudFront, configure CloudFront behaviors so:

- `/api/*` forwards to the Spring Boot backend or API load balancer.
- All frontend routes such as `/dashboard`, `/uploads`, `/logs/:uploadId`, and `/chat` fall back to `index.html`.
- Static assets are served from the S3 frontend bucket.

For a separate backend domain, update:

```text
src/environments/environment.production.ts
```

## Deployment Checklist

- Run `npm run build:prod`.
- Upload `dist/log-analyzer-ui/browser` to S3 or your static host.
- Configure SPA fallback to `index.html`.
- Configure `/api/*` proxying to the backend.
- Verify JWT auth, upload flow, log viewer, analysis, chat streaming, and rate-limit status against the deployed backend.
