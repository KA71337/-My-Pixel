# Authorized owner importer

No Tap.az scraper was enabled: written consent required by §9.5.2 / §9.6 has not been established. No CAPTCHA/403/429/private API bypass or curl. 35 audit links recorded in source-links.md; 0 source products and 0 source photos imported. Source pages can disappear/change; listing references are not a live availability claim.

Supply your own authorized JSON array or UTF-8 CSV and original JPEG/PNG/WebP files. Do not derive files by copying Tap.az without appropriate permission. Categories must be created through admin beforehand (local or GitHub). CSV has headers equal to schema fields; quoted commas/newlines/escaped double quotes supported. `images`, `specifications`, `imageFiles` are JSON arrays inside CSV cells. Unknown/missing price -> null; unknown description, brand/model/condition/availability -> empty strings. No price inference, no description translation.

Minimum row: sourceId (numeric), name, sourceUrl if confirmed. Optional slug, price, currency='AZN', categoryId, brand, model, description, specifications=[{key,value}], published=false, featured=false, imageFiles=[relative original file paths]. Defaults are empty metadata / unpublished. Do not send id/timestamps unless necessary; original creation time preserved on updates. Each file must stay inside the chosen image root (realpath prevents traversal/symlink escape).

Dry run: `npm run import -- owner-import/products.json owner-import/images --owner-authorized`
Apply: `npm run import -- owner-import/products.csv owner-import/images --owner-authorized --apply`

CLI supports Node `--env-file=.env.local` if running directly: `node --env-file=.env.local --import tsx scripts/import.ts ...`. npm's importer does not implicitly load ENV; export variables in shell or use this direct command. Never paste secrets into source. --owner-authorized is the operator's attestation, not proof of Tap.az permission.

Reports: docs/last-import-report.json: found/imported/updated/duplicates/photos/errors/applied. IDs upsert by sourceId; duplicates in one input skipped; existing records updated, never automatically deleted if absent. Products preserve descriptions and do not infer characteristics/categories from title. Photo uploads normalize/strip metadata, immutable dedup by hash. Dry-run never writes catalog or photos. Invalid rows are reported and skipped; successful rows may apply. Take a backup/review report first. A stale catalog SHA rejects the final write; staged images may become orphaned but do not publish products.

Production writes create data commits via Contents API. Application live writes were not tested during final delivery without the owner's configured GITHUB_TOKEN; Git push authentication does not substitute for application ENV credentials.
