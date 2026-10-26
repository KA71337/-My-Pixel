import { execFileSync } from 'node:child_process';
const files=execFileSync('git',['ls-files','-z']).toString().split('\0').filter(Boolean);
const forbidden=files.filter(p=>/(^|\/)(node_modules|\.next|\.local|\.vercel|test-results|playwright-report|owner-import|temp|tmp)(\/|$)/i.test(p)||/(^|\/)\.env(?:\.|$)/.test(p)&&p!=='.env.example'||/\.log$|\.tsbuildinfo$|-output\.txt$/.test(p));
const patterns=[/gh[pousr]_[A-Za-z0-9]{30,}/,/github_pat_[A-Za-z0-9_]{30,}/,/AKIA[A-Z0-9]{16}/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/(?:ADMIN_PASSWORD|SESSION_SECRET|GITHUB_TOKEN|UPSTASH_REDIS_REST_TOKEN)\s*=\s*[^\s'";]{16,}/];
const findings=[];
for(const file of files){const content=execFileSync('git',['show',':'+file],{maxBuffer:20*1024*1024}).toString();if(patterns.some(p=>p.test(content)))findings.push(file);}
const catalog=JSON.parse(execFileSync('git',['show',':data/catalog.json']).toString());
if(catalog.products.length||catalog.categories.length)throw new Error('Delivery seed must remain empty without authorized source export');
if(forbidden.length||findings.length){console.error(JSON.stringify({forbiddenPaths:forbidden,secretFindingPaths:findings}));process.exit(1);}
console.log(`Staged safety scan PASS: ${files.length} paths, no prohibited artifacts or recognized secret patterns, empty source product catalog. Heuristic scan, not a guarantee.`);
