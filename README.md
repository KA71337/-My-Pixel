# My Pixel

Next.js 16 / TypeScript commercial storefront and server-authenticated AZ admin.

## Run locally

1. `npm install`
2. `npm run seed` (does not overwrite existing seed)
3. Copy `.env.example` to `.env.local`, set a unique ADMIN_PASSWORD (16+ characters), SESSION_SECRET (32+ random characters), STORAGE_MODE=local.
4. `npm run dev` — public site at `/`, admin at `/admin/login`.
5. `npm test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`.

Local mutations live in ignored `.local/`; seed is `data/catalog.json`. Test fixtures are isolated; the real catalog is intentionally empty until authorized owner data is supplied. Do not publish test products.

## Functionality

AZ/RU public routes: `/`, `/catalog`, `/categories`, `/product/[slug]`, `/services`, `/about`, `/contacts`. Search/category/brand/model/price filters, sorting, pagination, gallery/fullscreen, responsive mobile navigation. Original product descriptions are preserved, not machine-translated. Admin: dashboard, product/category/service CRUD, publish/hide, featured selection, contact/social/logo/cover editing, upload, gallery ordering/removal. Removing category in use is rejected. SHA-based optimistic concurrency requires reload on conflict. Public reads have no deploy-dependent cache.

Storage deliberately uses one atomic `data/catalog.json` envelope instead of three separate files, avoiding partial updates/referential inconsistency. Images are `data/media/<sha256>.webp`, served by `/media/...` immediately, without redeploy. No GitHub token reaches client code. Admin writes to GitHub create storage commits only after production setup/use; the final authorized delivery commits the implementation to `main`; live application storage writes still require the owner's separately configured token.

See [Deployment](docs/deployment.md), [Security](docs/security.md), [Import](docs/import.md), [source links](docs/source-links.md) and [verification](docs/verification.md).

## Production status

No existing Vercel target was identified by the completed audit. No project was created/linked/deployed; no unrelated project touched. User supplies GITHUB_TOKEN manually. Live GitHub writes and production deployment are not verified without configured credentials. Owner-supplied licensed product data/images still required.
