# Verified target and remaining Vercel configuration

## Target discovery

GitHub CLI authorized repository metadata for `KA71337/-My-Pixel` reports default branch `main`, push permission, and homepage `https://my-pixel-one.vercel.app`. Its main commit Vercel status links to:

https://vercel.com/kyamich/my-pixel/C9CGUo4ZtmVRafo6rJkeQwuZVvZL

The HTTPS homepage returned HTTP 200 with `Server: Vercel` and HTML deployment ID `dpl_C9CGUo4ZtmVRafo6rJkeQwuZVvZL`, exactly matching the GitHub status. Thus the repository-linked live target is scope `kyamich`, project `my-pixel`, origin `https://my-pixel-one.vercel.app`. The HTML contains a server error boundary/loading fallback: HTTP 200 alone does not establish catalog functionality.

No `.vercel/project.json` exists. Vercel projectId/orgId, current Git integration and current cloud environment values cannot be inspected: dashboard and exact deployment require login, Vercel CLI is absent, standard CLI auth files are absent, no VERCEL_TOKEN was present, and no MCP server was configured. No cloud variables, integrations or deployments were changed. Do not link any other project or create a new project.

## Local configuration actually saved

`scripts/configure-vercel.mjs init-local` created `.env.local` with these keys:

- STORAGE_MODE=github
- GITHUB_OWNER=KA71337
- GITHUB_REPO=-My-Pixel
- GITHUB_BRANCH=main
- GITHUB_CATALOG_PATH=data/catalog.json
- ADMIN_PASSWORD: cryptographically generated from 24 random bytes
- SESSION_SECRET: cryptographically generated from 48 random bytes

The file is ignored, untracked, and has Windows inheritance removed with access granted only to its creating user. Retrieve secrets by opening `.env.local` locally in a trusted editor; never paste them in chat. Values were not printed. Existing cloud secrets remain unknown and MUST be preserved if valid, not overwritten by the locally generated candidates.

NEXT_PUBLIC_SITE_URL was discovered after this private file was initialized, so it is prepared in the helper/checklist but is NOT claimed to be set in the existing private file. The helper preserves an existing file and never reads `.env.example` or rotates existing secrets. `.env.example` was left unchanged because a previous access safeguard denied it.

## Production values to apply after authorized access

Set the five non-secret storage values above and:

`NEXT_PUBLIC_SITE_URL=https://my-pixel-one.vercel.app`

Use the existing valid production ADMIN_PASSWORD and SESSION_SECRET if present; only use the local candidates if genuinely missing. Add credentials using Vercel secret environment UI or authorized env tooling, never tracked files or command arguments containing literal tokens. Inspect existing values privately and do not dump decrypted environment API responses into logs.

Exactly still required:

1. Sign in locally to the Vercel account/team that controls `kyamich/my-pixel`, or authorize its CLI. Confirm project Git integration matches `KA71337/-My-Pixel` and production branch `main`; obtain actual projectId/orgId before linking.
2. GITHUB_TOKEN: fine-grained token restricted to `KA71337/-My-Pixel`, repository Contents read and write (Metadata read is implicit). GitHub CLI authorization/push permission is NOT a minimally scoped application storage token and was deliberately not exported/reused. Supply it directly in Vercel, not chat. No application GitHub token is available in the process environment.
3. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN: real REST credentials of an owner-approved Redis database. No credentials were available in the process environment; no authorized integration access was available. Never invent these values or substitute GitHub/Vercel tokens. Reuse a valid existing project integration first.

Production admin fails closed without Redis; GitHub catalog reads fail without GITHUB_TOKEN. A successful build is not a runtime credential check.

## Preview isolation

Do NOT copy the production write token, ADMIN_PASSWORD, SESSION_SECRET, Redis credentials or main branch write configuration to Preview. With this source, all NODE_ENV=production/Vercel environments require HTTPS origin and Redis. Reusing main and the write token would let preview mutate production catalog; shared secrets/Redis would also share session/throttle namespace.

Safest initial preview: STORAGE_MODE=github and owner/repository/path values may be shared, but no admin/session/write secrets. A repository-scoped Contents read-only token permits public catalog inspection; no token means unavailable catalog, safely fail-closed. Full preview admin needs a separate approved catalog branch, separate secrets and isolated Redis instance, plus preview-specific exact origin (not the production origin). Current source does not derive NEXT_PUBLIC_SITE_URL from VERCEL_URL: do not assume it does. Unknown preview origins should leave admin disabled rather than weaken CSRF origin validation. Keep preview indexing blocked using Vercel preview protection/headers before public release; that setting has not been changed here.

## Completion after access

Inspect existing cloud key names/targets without outputting values. Set only missing/corrected values on the verified project, verify through private pull/runtime checks, then redeploy only when authorized. Do not commit or push until the owner reviews the current unstaged changes. Perform read-only catalog/media checks and admin login/session/revocation checks once real credentials are present; do not test production writes without separate approval.

## Helper

- `node scripts/configure-vercel.mjs audit`: non-secret repository/deployment metadata report.
- `node scripts/configure-vercel.mjs init-local`: generates private ignored configuration only if absent; refuses overwriting or silent rotation. Does not deploy, link or mutate cloud state.
