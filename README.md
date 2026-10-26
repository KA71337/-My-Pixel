# My Pixel

Next.js 16 / TypeScript commercial storefront and server-authenticated AZ admin.

## Run locally

1. `npm install`
2. `npm run seed` (does not overwrite existing seed)
3. Copy `.env.example` to `.env.local`, set a unique ADMIN_PASSWORD (16+ characters), SESSION_SECRET (32+ random characters), STORAGE_MODE=local.
4. `npm run dev` — public site at `/`, admin at `/admin/login`.
5. `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`.

Local mutations live in ignored `.local/`; seed is `data/catalog.json`. The seed now contains 35 verified owner shop listings and 162 local product photos captured from normal public pages on 2026-10-26. Prices/descriptions are source snapshots, not guarantees of stock. Test fixtures remain isolated; do not publish test products. An existing `.local/catalog.json` overrides the seed: back it up and reconcile explicitly rather than silently overwriting admin changes.

## Functionality

AZ/RU public routes: `/`, `/catalog`, `/categories`, `/product/[slug]`, `/services`, `/about`, `/contacts`. Search/category/brand/model/price filters, sorting, pagination, gallery/fullscreen, responsive mobile navigation. Original product descriptions are preserved, not machine-translated. Admin: dashboard, product/category/service CRUD, publish/hide, featured selection, contact/social/logo/cover editing, upload, gallery ordering/removal. Removing category in use is rejected. SHA-based optimistic concurrency requires reload on conflict. Public reads have no deploy-dependent cache.

Storage deliberately uses one atomic `data/catalog.json` envelope instead of three separate files, avoiding partial updates/referential inconsistency. Images are `data/media/<sha256>.webp`, served by `/media/...` immediately, without redeploy. No GitHub token reaches client code. Admin writes to GitHub create storage commits only after production setup/use; the final authorized delivery commits the implementation to `main`; live application storage writes still require the owner's separately configured token.

See [Deployment](docs/deployment.md), [Security](docs/security.md), [Import](docs/import.md), [source links](docs/source-links.md) and [verification](docs/verification.md).

## Production status

The repository-linked Vercel target is `kyamich/my-pixel`, site `https://my-pixel-one.vercel.app`. No database is required: catalog JSON and media remain in the existing GitHub repository. Supply a repository-only application GITHUB_TOKEN, strong ADMIN_PASSWORD, random SESSION_SECRET and exact HTTPS NEXT_PUBLIC_SITE_URL; see deployment docs for storage keys. Login throttling and logout replay denial are bounded, instance-local and reset on restart, not distributed or durable; signed sessions expire after 8 hours. See the security model before deployment. Cloud variables, linkage, deployments, commits and pushes were not changed in this no-database step. Current read-only CLI findings are recorded separately from historical dashboard access. Live application GitHub writes and production admin tests remain unverified. Existing shop branding, catalog and media are unchanged.
