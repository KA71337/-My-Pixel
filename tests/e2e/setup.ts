import { rmSync } from 'node:fs';
export default function setup(){rmSync('.local/e2e',{recursive:true,force:true});}
