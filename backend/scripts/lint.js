import { readdirSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

const allowedExtensions = new Set(['.js', '.json', '.html', '.css']);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        return [];
      }
      return walk(fullPath);
    }
    return [fullPath];
  });
}

const files = walk(root).filter((file) => allowedExtensions.has(extname(file)));
let hasError = false;

files.forEach((file) => {
  const content = readFileSync(file, 'utf8');
  if (/\t/.test(content)) {
    console.error(`Tab character found in ${file}`);
    hasError = true;
  }
  if (/\r\n/.test(content)) {
    console.error(`Windows line endings detected in ${file}`);
    hasError = true;
  }
});

if (hasError) {
  process.exitCode = 1;
} else {
  console.log('Lint check passed.');
}
