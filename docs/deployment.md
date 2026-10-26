# Deployment and ENV

Do not create a new Vercel target automatically. Identify the owner's existing target first; the completed audit found no match in 7 accessible projects. Nothing has been linked or deployed in this stage.

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

LOCAL_DATA_DIR optional for local/test only. The delivered seed is `data/catalog.json` in main. Product/media imports remain empty until an authorized owner export is supplied. Repository delivery uses Git authentication; application storage uses the separately supplied GITHUB_TOKEN. Live application writes were not exercised without that token. After identifying the existing target, configure ENV and redeploy it; never link a guessed target.

Then rebuild/redeploy the verified existing target and test production. Never write on Vercel's ephemeral filesystem: local mode on Vercel is rejected. Build does not need GITHUB_TOKEN since public data routes are dynamic. If token absent runtime reports unavailability, not stale invented data. Redis is required only for production admin.

All catalog GET reads use GitHub Contents API `cache:no-store`; new requests see saved data without deploy. API throttling/outages may render retry/error states. For large catalogs/traffic, monitor rate limits and move to a dedicated durable database/object store under a separate approved migration. Images under 4 MB are normalized to WebP before writing; API function request ceilings still apply.
