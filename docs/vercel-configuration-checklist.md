# Verified target and remaining Vercel configuration

## Target discovery

GitHub CLI authorized repository metadata for `KA71337/-My-Pixel` reports default branch `main`, push permission, and homepage `https://my-pixel-one.vercel.app`. Its main commit Vercel status links to:

https://vercel.com/kyamich/my-pixel/C9CGUo4ZtmVRafo6rJkeQwuZVvZL

The HTTPS homepage returned HTTP 200 with `Server: Vercel` and HTML deployment ID `dpl_C9CGUo4ZtmVRafo6rJkeQwuZVvZL`, exactly matching the GitHub status. Thus the repository-linked live target is scope `kyamich`, project `my-pixel`, origin `https://my-pixel-one.vercel.app`. The HTML contains a server error boundary/loading fallback: HTTP 200 alone does not establish catalog functionality.

Current authorized configuration: `.vercel/project.json` now links the exact verified project via cached Vercel CLI 65.2.0; the global/PATH CLI remains unnecessary. See `no-db-production-env-applied.md` for actual applied commands, key-presence checks and blockers. `whoami` and `project inspect my-pixel --scope kyamich` succeeded; actual project ID is `prj_doji2V3Ed4bCp1ygujd7GzP0l8IP`, owner Kyamich, framework Next.js, Node 24.x. See no-db-cli-auth-check.md and no-db-project-identity.md for filtered Git linkage metadata. Historical dashboard-login failures do not describe current CLI access. No readable cloud environment values were read. The authorized task created the exact local link and applied production keys; integrations and deployments were not changed. Do not link any other project or create a new project.

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

## Production configuration applied and verified

Applied the five nonsecret storage settings above plus `NEXT_PUBLIC_SITE_URL=https://my-pixel-one.vercel.app` to production only; every add returned exit 0. ADMIN_PASSWORD and SESSION_SECRET were absent initially and were uploaded from the existing ignored owner-only `.env.local` via CLI stdin as sensitive production variables, with suppressed output and no secret process arguments. Both returned exit 0 and key presence was verified. No existing cloud credentials were rotated; no readable cloud values were fetched.

Verified production key names: STORAGE_MODE, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH, GITHUB_CATALOG_PATH, NEXT_PUBLIC_SITE_URL, ADMIN_PASSWORD, SESSION_SECRET. GITHUB_TOKEN is missing and remains an owner-supplied blocker. Preview and development have no environment keys; no production credentials were copied. UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN were absent initially and verified absent across all three targets, so no deletion was needed.

Normal exact-project link created `.vercel/project.json` and added `.vercel` to `.gitignore`. The initial metadata parser safely stopped before any secret upload, then was corrected for the CLI table layout. Command evidence is in `no-db-production-env-applied.md`. No commit, push or deployment yet.

Exactly still required:

1. Exact project linkage is now verified at `.vercel/project.json`: `kyamich/my-pixel`, projectId `prj_doji2V3Ed4bCp1ygujd7GzP0l8IP`, orgId `team_msBK9ewJruPZ0vSrUaxtJT45`, GitHub `KA71337/-My-Pixel`, production branch `main`. The initial cloud listing contained no environment keys. Six nonsecret production keys were applied successfully (CLI exit 0); existing secrets are never overwritten. See `no-db-production-env-applied.md` for the final admin/session upload and verification results.
2. GITHUB_TOKEN: fine-grained token restricted to `KA71337/-My-Pixel`, repository Contents read and write (Metadata read is implicit). GitHub CLI authorization/push permission is NOT a minimally scoped application storage token and was deliberately not exported/reused. Supply it directly in Vercel, not chat. No application GitHub token is available in the process environment.
No database credentials are needed. Authentication uses signed expiring cookies, bounded per-instance memory throttling and instance-local logout replay denial, not durable distributed state. See security.md for restart/multi-instance limitations.

GitHub catalog reads fail without GITHUB_TOKEN; login still requires strong ADMIN_PASSWORD, SESSION_SECRET and a valid HTTPS NEXT_PUBLIC_SITE_URL. A successful build is not a runtime credential check.

## Preview isolation

Do NOT copy the production write token, ADMIN_PASSWORD, SESSION_SECRET or main branch write configuration to Preview. All NODE_ENV=production/Vercel environments require HTTPS origin and valid auth secrets, but no database. Reusing main and the write token would let preview mutate production catalog; sharing SESSION_SECRET would allow production signed sessions in preview. Counters and replay-denial state remain instance-local.

Safest initial preview: STORAGE_MODE=github and owner/repository/path values may be shared, but no admin/session/write secrets. A repository-scoped Contents read-only token permits public catalog inspection; no token means unavailable catalog, safely fail-closed. Full preview admin needs a separate approved catalog branch, separate admin/session secrets, plus preview-specific exact origin (not the production origin). Current source does not derive NEXT_PUBLIC_SITE_URL from VERCEL_URL: do not assume it does. Unknown preview origins should leave admin disabled rather than weaken CSRF origin validation. Keep preview indexing blocked using Vercel preview protection/headers before public release; that setting has not been changed here.

## Completion after access

Inspect existing cloud key names/targets without outputting or pulling values. Applied production configuration is recorded in `no-db-production-env-applied.md`; key-presence checks do not establish token scope or live runtime correctness. Push/deploy is deferred to the next authorized task. Do not commit or push until the owner reviews the current unstaged changes. Perform read-only catalog/media checks and admin login/session/revocation checks once real credentials are present; do not test production writes without separate approval.

## Helper

- `node scripts/configure-vercel.mjs audit`: non-secret repository/deployment metadata report.
- `node scripts/configure-vercel.mjs init-local`: generates private ignored configuration only if absent; refuses overwriting or silent rotation. Does not deploy, link or mutate cloud state.
