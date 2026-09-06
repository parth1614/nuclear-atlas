import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const result = spawnSync(
  process.execPath,
  [fileURLToPath(new URL('node_modules/vinext/dist/cli.js', root)), 'build'],
  {
    cwd: fileURLToPath(root),
    env: { ...process.env, ATLAS_STATIC_EXPORT: '1' },
    stdio: 'inherit',
  },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

// Fail deployment if it would publish only asset chunks and produce a 404.
const html = readFileSync(new URL('dist/client/index.html', root), 'utf8');
if (!html.includes('Nuclear Atlas') || !html.includes('<script')) {
  throw new Error(
    'The static export is missing the atlas page or client scripts.',
  );
}
console.log('Vercel export ready: dist/client/index.html');
