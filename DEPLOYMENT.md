# Marketing Operations — PostgreSQL deployment

This branch adds a PostgreSQL-backed API for the existing Marketing Operations dashboard.

## Architecture

- Browser / Google AI Studio frontend → `https://marketing-api.bezaverse.com`
- Cloudflare Tunnel → Docker service `marketing-api:3000`
- `marketing-api` joins the existing `progroup_default` network and the separate `marketing-db-net` network.
- PostgreSQL remains private on `marketing-db-net`; do not publish port 5432.

The API persists six collections in separate PostgreSQL tables:
`marketing_workspaces`, `marketing_brands`, `marketing_content`,
`marketing_campaigns`, `marketing_team_members`, and
`marketing_activity_logs`. Each row has a stable primary key, workspace index,
position, and JSONB payload. Mutations are committed in a single transaction
before the API acknowledges success.

## Deploy on the Windows Docker host

Run these commands in PowerShell. The repository should be cloned beside the
existing `postgres` folder, not inside or over it.

```powershell
cd C:\docker-data\marketing-platform
git clone --branch main https://github.com/mario1040/Marketing-Operations.git app
cd .\app
```

Before starting the API, create backups. This does not modify the running
PostgreSQL container or its volume.

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
Copy-Item .\data\marketing_db.json ".\data\marketing_db.pre-postgres-$stamp.json"
docker exec marketing-postgres pg_dump -U marketing_admin -d marketing_ops -Fc -f /tmp/marketing_ops_pre_api.dump
docker cp marketing-postgres:/tmp/marketing_ops_pre_api.dump ".\marketing_ops_pre_api_$stamp.dump"
```

Create the local-only `.env` file. The password is read directly from the
existing container and URL-encoded. The API token is randomly generated and
is never printed by this command.

```powershell
$pgPassword = (docker exec marketing-postgres printenv POSTGRES_PASSWORD).Trim()
if (-not $pgPassword) { throw 'Could not read POSTGRES_PASSWORD from marketing-postgres. Do not guess it; inspect the existing server .env locally.' }
$encodedPassword = [uri]::EscapeDataString($pgPassword)
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$apiToken = [Convert]::ToBase64String($bytes)
$rng.Dispose()
$studioOrigin = Read-Host 'Paste the exact Google AI Studio preview origin (scheme + host only)'
if (-not $studioOrigin.StartsWith('https://')) { throw 'A valid HTTPS Google AI Studio origin is required.' }
$envText = @"
DATABASE_URL=postgresql://marketing_admin:$encodedPassword@marketing-db:5432/marketing_ops
API_TOKEN=$apiToken
CORS_ORIGINS=https://marketing-api.bezaverse.com,$studioOrigin
"@
[IO.File]::WriteAllText((Join-Path $PWD '.env'), $envText, [Text.Encoding]::ASCII)
Remove-Variable pgPassword, encodedPassword, bytes, apiToken, envText
```

Build and start only the new API container:

```powershell
docker compose up -d --build
docker compose ps
docker logs --tail 100 marketing-api
```

The first successful start creates the six application tables and imports
`data/marketing_db.json` only if the Marketing schema has not already been
initialized. It never drops or truncates unrelated PostgreSQL tables or
touches the Evolution / n8n databases. The JSON source is mounted read-only.
The frontend does not read, write, import, or fall back to browser-side business data. PostgreSQL is the only source of operational records.

## Verify

```powershell
Invoke-RestMethod https://marketing-api.bezaverse.com/api/health
docker exec marketing-postgres psql -U marketing_admin -d marketing_ops -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'marketing_%' ORDER BY table_name;"
```

The public health endpoint should report `database: connected`. Data endpoints
must return HTTP 401 without a bearer token.

Copy the token to the clipboard when you are ready to open the frontend. Do not
paste it into chat, GitHub, AI Studio build-time secrets, or source code.

```powershell
$token = ((Get-Content .env | Where-Object { $_ -like 'API_TOKEN=*' }) -split '=', 2)[1]
Set-Clipboard $token
Remove-Variable token
```

After deploying the frontend, open the existing Google AI Studio project connected to this repository and deploy the latest `main` source to the existing frontend Cloud Run service. Do not redeploy or modify the `marketing-api` or `marketing-postgres` services for this frontend-only change.

The frontend requests `Accept-Encoding: identity` from the backend proxy and disables HTTP caching for API data. API responses include `Cache-Control: no-store`.

For each new page session, open Settings, enter the Marketing API access token, and press **Test Access**. After HTTP 200, the dashboard loads the shared PostgreSQL snapshot. The token is held in page memory only; it is not stored in `localStorage` and must be entered again after a full page reload.

## Operational notes

- Keep `.env`, JSON backups, and `.dump` files out of Git.
- Never publish PostgreSQL port 5432.
- The API requires an exact CORS origin allowlist and a bearer token.
- Business records are never persisted in `localStorage`, `sessionStorage`, IndexedDB, or the browser HTTP cache.
- If the API is unavailable or authentication is missing, the UI shows a disconnected state and does not display local or demo data.
- Take regular PostgreSQL backups after deployment. Do not run
  `docker compose down -v`, `docker volume prune`, or remove the existing
  named volumes.
