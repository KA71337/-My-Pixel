import { execFileSync } from 'node:child_process';
const files=execFileSync('git',['ls-files','-z']).toString().split('\0').filter(Boolean);
const forbidden=files.filter(p=>/(^|\/)(node_modules|\.next|\.local|\.vercel|test-results|playwright-report|owner-import|temp|tmp)(\/|$)/i.test(p)||/(^|\/)\.env(?:\.|$)/.test(p)&&p!=='.env.example'||/\.log$|\.tsbuildinfo$|-output\.txt$/.test(p));
const patterns=[/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{30,}/,/AKIA[A-Z0-9]{16}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/(?:ADMIN_PASSWORD|SESSION_SECRET|GITHUB_TOKEN)\s*=\s*[^\s'";]{16,}/];
const findings=[];
// The protected environment sample is deliberately not inspected.
for(const file of files.filter(p=>p!=='.env.example')){const content=execFileSync('git',['show',':'+file],{maxBuffer:20*1024*1024}).toString();if(patterns.some(p=>p.test(content)))findings.push(file);}
const catalog=JSON.parse(execFileSync('git',['show',':data/catalog.json']).toString());
// Preserve the already authorized catalog exactly; this change is not an import.
const original=execFileSync('git',['show','HEAD:data/catalog.json']);
const staged=execFileSync('git',['show',':data/catalog.json']);
if(!original.equals(staged))throw new Error('Catalog changed outside the authorized no-database corrections');
if(forbidden.length||findings.length){console.error(JSON.stringify({forbiddenPaths:forbidden,secretFindingPaths:findings}));process.exit(1);}
console.log(`Staged safety scan PASS: ${files.length} paths, no prohibited artifacts or recognized secret patterns, authorized catalog unchanged (${catalog.products.length} products). Heuristic scan, not a guarantee.`);
