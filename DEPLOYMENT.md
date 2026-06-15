# LogAI Frontend Deployment

## Release Commands

Install the locked dependency tree and run the release checks:

```bash
npm ci
npm run typecheck
npm run typecheck:spec
npm run test:ci
npm run build:prod
```

The deployable static files are generated in:

```text
dist/log-analyzer-ui/browser
```

## API Configuration

Local development uses:

```text
http://localhost:8080/api
```

Production currently uses the relative base URL:

```text
/api
```

This is the recommended configuration for AWS S3 + CloudFront. Configure
CloudFront with two origins:

1. The S3 bucket containing the Angular build.
2. The deployed Spring Boot backend.

Create a `/api/*` behavior that forwards to the backend origin with:

- HTTPS only
- Caching disabled
- All query strings forwarded
- `Authorization` forwarded
- `Content-Type` and required CORS headers forwarded
- Streaming responses enabled for `/api/chat/stream`

The default behavior should serve the S3 frontend origin.

The frontend already includes `/api` in every production request. Configure the
CloudFront backend origin with no `/api` origin path when the backend itself
serves routes under `/api`. For example:

```text
Browser request: /api/uploads
CloudFront behavior: /api/*
Backend request: /api/uploads
```

Do not configure an additional `/api` origin path, or CloudFront may duplicate
the API prefix before forwarding requests.

If the frontend and backend are deployed on separate domains without a proxy,
change `src/environments/environment.production.ts` before building:

```ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://YOUR_BACKEND_DEPLOYED_DOMAIN/api'
};
```

Do not include a trailing slash.

## SPA Routing

Configure the host to return `index.html` for unknown frontend routes such as:

```text
/dashboard
/uploads
/logs
/logs/:uploadId
/analysis
/analysis/:uploadId
/chat
/rate-limit
/login
/register
```

Create a CloudFront Function using:

```text
deployment/cloudfront-spa-rewrite.js
```

Attach it to the viewer-request event of the default S3 frontend behavior
only. Do not attach it to the `/api/*` behavior. The function rewrites `/`,
all extensionless Angular routes, and dynamic routes to `/index.html`, while
leaving JavaScript, CSS, images, fonts, and other files unchanged.

This covers every current route:

```text
/
/login
/register
/dashboard
/uploads
/logs
/logs/:uploadId
/analysis
/analysis/:uploadId
/chat
/rate-limit
```

Using a frontend-only rewrite is preferred over distribution-wide custom
403/404 responses because API `404` responses must remain API errors rather
than being replaced with Angular HTML.

## Backend Configuration

The backend must be deployed with HTTPS and configured with:

```text
CORS_ALLOWED_ORIGINS=https://YOUR_FRONTEND_DEPLOYED_DOMAIN
```

Required backend routes:

```text
POST  /api/auth/login
POST  /api/auth/register
GET   /api/auth/me
PATCH /api/auth/profile
GET   /api/chat/stream
GET   /api/actuator/health
```

The SSE endpoint receives `message`, `uploadId`, and `token` as URL-encoded
query parameters. Use HTTPS because the JWT is present in the query string.
Configure proxy and application logs so query strings are not retained.
Disable caching for SSE, forward all query strings, and use an origin response
timeout that exceeds the maximum expected chat response duration. The frontend
closes the EventSource on completion, cancellation, navigation, logout, and the
first transport error, preventing browser reconnect loops. A terminal
`EventSource.CLOSED` result with no backend error payload is treated as a
completed duplicate reconnect, matching the backend's HTTP 204 behavior.

## Environment Variables

This Angular application uses compile-time environment files and does not read
a `.env` file at runtime. No frontend environment variables are required when
using the relative `/api` configuration.

When using a separate backend domain, update
`src/environments/environment.production.ts` and rebuild.

## Recommended Hosting

Recommended for the planned AWS architecture:

- Frontend: S3
- CDN and TLS: CloudFront
- Backend: EC2, ECS, Elastic Beanstalk, or another HTTPS origin
- API routing: CloudFront `/api/*` behavior

## Post-Deployment Smoke Test

Verify:

1. Refreshing a protected route loads the Angular application.
2. Registration and login return a JWT and redirect correctly.
3. `GET /api/auth/me` populates the sidebar profile.
4. Upload progress and processing status complete.
5. Logs, filters, pagination, and statistics load.
6. Analysis reaches `COMPLETED` and renders the result.
7. Standard and SSE chat responses complete without duplication.
8. Stopping or leaving SSE chat closes the connection.
9. Rate-limit minute and daily counters update.
10. Logout clears the session and returns to `/login`.
11. `GET /api/actuator/health` returns `200` with `{"status":"UP"}`.
