import { defineConfig } from '@playwright/test';
import { randomBytes } from 'node:crypto';
// A one-time setup clears leftover fixtures before starting the test server.
const password=process.env.MP_TEST_PASSWORD||randomBytes(24).toString('hex');
process.env.MP_TEST_PASSWORD=password;
export default defineConfig({globalSetup:'./tests/e2e/setup.ts',testDir:'./tests/e2e',fullyParallel:false,workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:3100',trace:'retain-on-failure'},webServer:{command:'npm run dev -- --port 3100',url:'http://127.0.0.1:3100',reuseExistingServer:false,timeout:120000,env:{ADMIN_PASSWORD:password,SESSION_SECRET:randomBytes(32).toString('hex'),STORAGE_MODE:'local',LOCAL_DATA_DIR:'.local/e2e',NEXT_PUBLIC_SITE_URL:'http://127.0.0.1:3100'}}});
