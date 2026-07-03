#!/usr/bin/env node
/**
 * SafetyPRO static syntax check.
 * Esegue node --check su tutti i file JS locali, esclusi asset/vendor eventuali.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const excludedDirs = new Set(['node_modules', '.git', 'vendor', 'dist', 'build']);

function walk(dir, out = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (excludedDirs.has(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, out);
    else if (item.isFile() && full.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = walk(root).sort();
let failed = 0;

for (const file of files) {
  const rel = path.relative(root, file);
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    console.error(`\n[JS SYNTAX FAIL] ${rel}`);
    if (result.stderr) console.error(result.stderr.trim());
    if (result.stdout) console.error(result.stdout.trim());
  } else {
    console.log(`[ok] ${rel}`);
  }
}

if (failed) {
  console.error(`\n${failed} file JS con errori di sintassi.`);
  process.exit(1);
}

console.log(`\nControllo sintassi JS completato: ${files.length} file verificati.`);
