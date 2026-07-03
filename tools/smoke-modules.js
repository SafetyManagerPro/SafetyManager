#!/usr/bin/env node
/**
 * Smoke test leggero: verifica che i moduli richiamati dalla nav esistano.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const matches = [...index.matchAll(/loadModule\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
const modules = [...new Set(matches)].sort();

const missing = modules.filter(m => !fs.existsSync(path.join(root, 'modules', `${m}.html`)));

console.log('Moduli rilevati:', modules.join(', '));
if (missing.length) {
  console.error('Moduli mancanti:', missing.join(', '));
  process.exit(1);
}

console.log(`Smoke test moduli ok: ${modules.length} moduli verificati.`);
