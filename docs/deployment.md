# Deployment and ENV

Do not create a new Vercel target automatically. The environment audit identified the repository-linked target as `kyamich/my-pixel`, live HTTPS origin `https://my-pixel-one.vercel.app`: its HTML deployment ID matches the GitHub main commit Vercel status. Authorized Vercel access is currently blocked by login; no local linkage or cloud changes were made. See `vercel-configuration-checklist.md` and `vercel-access-audit.md` for exact remaining access/credentials, private local setup and preview isolation.

The correction-stage file reader declined access to `.env.example`; no secret files were read or changed. Requirements below were verified against storage/auth/origin source code instead. Actual credential availability and live production behavior remain unverified.

Required actual ENV for the existing production target:
- STORAGE_MODE=github
- GITHUB_OWNER=KA71337
- GITHUB_REPO=-My-Pixel
- GITHUB_BRANCH=main
- GITHUB_CATALOG_PATH=data/catalog.json
- GITHUB_TOKEN: owner supplies a fine-grained token restricted to this repository, Contents read/write. Never use NEXT_PUBLIC_GITHUB_TOKEN.
- ADMIN_PASSWORD: strong unique 16+ character password, saved persistently in secret ENV. Do not print it.
- SESSION_SECRET: random 32+ character secret, saved persistently. Rotate to invalidate sessions.
- UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN: durable shared Redis for revocable sessions and atomic login throttling. Production admin fails closed if not configured. Do not reuse unrelated resources without permission.
- NEXT_PUBLIC_SITE_URL: exact real HTTPS deployment origin (no trailing path); needed for origin validation, canonical, sitemap, Schema URLs. Leave blank locally if unknown.

LOCAL_DATA_DIR optional for local/test only. The delivered seed is `data/catalog.json` in main. The seed contains 35 verified public owner listings and 162 local product photos, plus the shop logo. Include `data/media/` and `public/brand/` in the reviewed main delivery. No production credentials or Vercel settings were changed in this stage. Repository delivery uses Git authentication; application storage uses the separately supplied GITHUB_TOKEN. Live application writes were not exercised without that token. After identifying the existing target, configure ENV and redeploy it; never link a guessed target.

Then rebuild/redeploy the verified existing target and test production. Never write on Vercel's ephemeral filesystem: local mode on Vercel is rejected. Build does not need GITHUB_TOKEN since public data routes are dynamic. If token absent runtime reports unavailability, not stale invented data. Redis is required only for production admin.

All catalog GET reads use GitHub Contents API `cache:no-store`; new requests see saved data without deploy. API throttling/outages may render retry/error states. For large catalogs/traffic, monitor rate limits and move to a dedicated durable database/object store under a separate approved migration. Images under 4 MB are normalized to WebP before writing; API function request ceilings still apply.
