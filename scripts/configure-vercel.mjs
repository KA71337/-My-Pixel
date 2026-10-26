import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

// Never reads .env.example, prints secret values, rotates existing secrets, links,
// deploys, commits, or pushes. Cloud changes require independently verified linkage.
const root = process.cwd();
const expectedRepo = 'KA71337/-My-Pixel';
const known = {
  STORAGE_MODE: 'github', GITHUB_OWNER: 'KA71337', GITHUB_REPO: '-My-Pixel',
  GITHUB_BRANCH: 'main', GITHUB_CATALOG_PATH: 'data/catalog.json',
  NEXT_PUBLIC_SITE_URL: 'https://my-pixel-one.vercel.app'
};
const run = (cmd, args, extra = {}) => spawnSync(cmd, args, {
  cwd: root, encoding: 'utf8', timeout: 20000, windowsHide: true, ...extra
});
const gh = endpoint => {
  const r = run('gh', ['api', endpoint]);
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
};
const action = process.argv[2] || 'audit';
if (action === 'init-local') {
  const file = '.env.local';
  if (fs.existsSync(file)) {
    console.log('Existing .env.local preserved; no secrets read or rotated.');
    process.exit(0);
  }
  if (run('git', ['check-ignore', '-q', file]).status !== 0 ||
      run('git', ['ls-files', '--error-unmatch', file]).status === 0) {
    throw new Error('Refusing a non-ignored or tracked secret destination');
  }
  // Create empty file first, restrict ACL, then write secrets: no exposed interval.
  const fd = fs.openSync(file, 'wx', 0o600);
  try {
    if (process.platform === 'win32') {
      const user = run('whoami', []);
      if (user.status !== 0) throw new Error('Cannot determine current ACL identity');
      const acl = run('icacls', [path.resolve(file), '/inheritance:r', '/grant:r', `${user.stdout.trim()}:(F)`]);
      if (acl.status !== 0) throw new Error('Cannot restrict private configuration ACL');
    }
    const secrets = {};
    for (const [key, bytes, min] of [['ADMIN_PASSWORD', 24, 16], ['SESSION_SECRET', 48, 32]]) {
      const existing = process.env[key];
      if (existing && existing.length < min) throw new Error(`Existing ${key} is invalid; refusing silent rotation`);
      secrets[key] = existing || crypto.randomBytes(bytes).toString('base64url');
    }
    const values = { ...known, ...secrets };
    // Reuse only explicitly supplied runtime credentials, never Git CLI credentials.
    for (const key of ['GITHUB_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'])
      if (process.env[key]) values[key] = process.env[key];
    const body = '# Private local configuration. Never commit or paste these secrets in chat.\n' +
      '# NEXT_PUBLIC_SITE_URL is the HTTPS origin verified against the repository-linked deployment.\n' +
      '# Preview must NOT inherit production write/auth credentials or GITHUB_BRANCH=main.\n' +
      Object.entries(values).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('\n') + '\n';
    fs.writeFileSync(fd, body, 'utf8');
    console.log('Private ignored .env.local initialized; secret values are not printed.');
    console.log('Local key names:', Object.keys(values).join(', '));
  } catch (e) {
    fs.closeSync(fd); fs.unlinkSync(file); throw e;
  }
  fs.closeSync(fd);
} else if (action === 'audit') {
  const repo = gh(`repos/${expectedRepo}`);
  const deployments = gh(`repos/${expectedRepo}/deployments?per_page=30`);
  const checks = gh(`repos/${expectedRepo}/commits/main/check-runs`);
  const statuses = gh(`repos/${expectedRepo}/commits/main/status`);
  const lines = ['# Vercel environment access audit', '', `Repository: https://github.com/${expectedRepo}`, '',
    `Local Vercel linkage: ${fs.existsSync('.vercel/project.json') ? 'present (must verify gitRepository before mutation)' : 'absent'}`,
    `GitHub repository API: ${repo ? 'accessible' : 'unavailable (authorization/network)'}`];
  if (repo) lines.push(`Default branch: ${repo.default_branch}`, `Repository homepage: ${repo.homepage || '(none)'}`,
    `Repository push permission: ${repo.permissions?.push === true}`);
  lines.push('', '## Repository deployment references');
  if (Array.isArray(deployments)) {
    lines.push(`Deployments returned: ${deployments.length}`);
    for (const d of deployments.slice(0, 10)) {
      const ds = gh(`repos/${expectedRepo}/deployments/${d.id}/statuses?per_page=5`);
      for (const s of ds || []) if (s.environment_url) {
        try {
          const u = new URL(s.environment_url);
          if (u.protocol === 'https:' && !u.username && !u.password)
            lines.push(`- ${d.environment}: ${s.state}; origin ${u.origin}`);
        } catch {}
      }
    }
  } else lines.push('Deployment API unavailable.');
  // Only hostname/path of public project references; never dump API bodies or headers.
  for (const s of [...(checks?.check_runs || []), ...(statuses?.statuses || [])]) {
    const value = s.details_url || s.target_url;
    try { const u = new URL(value); if (u.hostname === 'vercel.com')
      lines.push(`- Vercel check reference: ${u.origin}${u.pathname}`); } catch {}
  }
  lines.push('', 'No cloud variables were changed. A deployment reference alone does not verify project ownership/linkage.',
    'Browser dashboard currently requires login; Vercel CLI and standard auth configuration were absent; no configured MCP server.',
    'Do not create or link a guessed project. Confirm Vercel gitRepository owner/repo and production branch before any mutation.',
    'Private local credentials, if initialized, are in .env.local; no values are recorded in this report.');
  fs.writeFileSync('docs/vercel-access-audit.md', lines.join('\n') + '\n');
  console.log('Non-secret report written to docs/vercel-access-audit.md');
} else {
  throw new Error('Usage: node scripts/configure-vercel.mjs [audit|init-local]');
}
