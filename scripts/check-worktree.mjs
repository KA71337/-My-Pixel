import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','.next','.git','.local','test-results','playwright-report'].includes(item.name))continue;const file=path.join(dir,item.name);if(item.isDirectory())walk(file);else files.push(file);}}
walk('.');
const candidates=files.filter(f=>/\.(ts|tsx|js|mjs|json|md|yml|yaml)$/.test(f)&&!f.endsWith('package-lock.json'));
const matches=[];for(const file of candidates){const raw=fs.readFileSync(file,'utf8');if(/gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}/.test(raw))matches.push(file);}
console.log('Source files:',files.length,'Credential pattern matches:',matches.length);
if(matches.length){console.error('Potential credential files:',matches);process.exitCode=1;}
console.log('HEAD:',execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
console.log('Branch:',execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim());
console.log(execFileSync('git',['status','--short'],{encoding:'utf8'}));
