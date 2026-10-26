# No-database configuration

Catalog and media remain in the existing GitHub JSON/media storage. No application database or external session service is used. package.json/package-lock.json already contained no database client dependency; the custom external session HTTP transport and its runtime requirements have been removed.

Production configuration (names and public values only):

```text
STORAGE_MODE=github
GITHUB_OWNER=KA71337
GITHUB_REPO=-My-Pixel
GITHUB_BRANCH=main
GITHUB_CATALOG_PATH=data/catalog.json
NEXT_PUBLIC_SITE_URL=https://my-pixel-one.vercel.app
ADMIN_PASSWORD=<strong unique secret, at least 16 characters>
SESSION_SECRET=<random secret, at least 32 characters>
GITHUB_TOKEN=<owner-token>
```

## Where the owner supplies GITHUB_TOKEN

In Vercel, open team `kyamich` → project `my-pixel` → Settings → Environment Variables. Add name `GITHUB_TOKEN`, paste a fine-grained GitHub token restricted to `KA71337/-My-Pixel` with Contents read/write (Metadata read is implicit), mark it Sensitive, and select **Production only**. Save and redeploy production once so the new runtime receives it. Do not paste the token in chat, commit it, or substitute a broad Git CLI credential. The token value has not been supplied; no empty/fabricated token is added.

Public GitHub catalog reads now work without a token. Admin writes fail closed with 503 until this restricted token is configured. Unauthenticated GitHub reads have a lower API rate limit and are not a production availability guarantee. Private repository reads require an authorized token.

LOCAL_DATA_DIR is optional for local/test use only. Keep production credentials out of Preview; preview admin needs its own approved branch, credentials and exact HTTPS origin. Git CLI authorization is not an application runtime token. Weak/missing auth secrets never bypass authentication.

`.env.example` remains unchanged; its contents were not inspected. No stale sample reference is claimed. Existing ignored `.env.local` remains unchanged. Earlier authorized provisioning uploaded the two existing auth secrets privately after ignore/ACL checks and set the six nonsecret production settings above; cloud key presence was verified without reading values. No preview/development keys or Redis keys were present.

Sessions use HMAC-SHA-256 signed cookies, random IDs/CSRF tokens and 8-hour expiry. Cookies are signed, not encrypted, and keep HttpOnly, SameSite=Strict and production Secure flags. Login password comparison, exact Origin, CSRF headers, server authorization and generic unexpected-error responses are retained. Login counters permit 10 attempts/address and 100 total per fixed 15-minute window per instance, including successful attempts. Maps prune expiry lazily, cap at 4096 entries each and reject new entries at capacity without evicting live protections.

Counters and logout token denylist are process/serverless-instance local: restarts reset them and other instances do not share them. Logout clears the browser cookie; copied cookies may replay elsewhere or after restart until expiry. There is no durable/global revocation promise. Rotate SESSION_SECRET consistently and retire old instances to invalidate existing sessions; password rotation alone does not invalidate sessions. Consider platform-level rate controls as complementary safeguards, without adding an application database.

Cached Vercel CLI 65.2.0 is authenticated. Exact `kyamich/my-pixel` inspection confirms Next.js, Node 24.x and the previously verified repository linkage to `KA71337/-My-Pixel`, production branch `main`. The existing ignored `.vercel/project.json` links only this intended project. No deployment, commit or push has yet been performed during final verification.

Final sequential verification: unit 16/16 passed, clean production build passed, then typecheck passed. An initial E2E wrapper yielded no final result; after confirming no remaining test processes, an isolated full E2E rerun passed 5/5 in 1.3 minutes. No retries or skipped tests. E2E uses isolated local storage, not production writes. Generated next-env.d.ts production references restored to HEAD after E2E. Historical raw check reports are local artifacts, excluded from delivery. Local verification is not a production credential or integration verification.
