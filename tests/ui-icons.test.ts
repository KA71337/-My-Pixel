import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';

// Keep icon rendering independent of system emoji fonts, including iOS.
test('UI arrows use the shared decorative SVG rather than Unicode glyphs', () => {
  function inspect(directory: string) {
    for (const entry of readdirSync(directory, {withFileTypes:true})) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) inspect(path);
      else if (path.endsWith('.tsx')) assert.doesNotMatch(readFileSync(path, 'utf8'), /[\u2190-\u21ff]/u, path);
    }
  }
  inspect('src/app');
  inspect('src/components');
  const icon = readFileSync('src/components/icon.tsx', 'utf8');
  assert.match(icon, /stroke="currentColor"/);
  assert.match(icon, /aria-hidden="true"/);
  assert.match(icon, /focusable="false"/);
});
