#!/usr/bin/env node
/**
 * SafetyPRO static audit.
 * Controlli senza dipendenze esterne per CI/GitHub.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');

function read(rel) {
  const p = path.join(root, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}
function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'build'].includes(item.name)) continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) walk(full, predicate, out);
    else if (item.isFile() && predicate(full)) out.push(full);
  }
  return out;
}

const index = read('index.html');
const sw = read('sw.js');
const supabase = read('js/supabase_config.js');
const cssFiles = walk(root, f => f.endsWith('.css'));
const jsFiles = walk(root, f => f.endsWith('.js'));

const issues = [];
const warnings = [];

function fail(id, message) { issues.push({ id, severity: 'error', message }); }
function warn(id, message) { warnings.push({ id, severity: 'warning', message }); }

if (!index.includes('http-equiv="Content-Security-Policy"')) fail('CSP_MISSING', 'index.html non contiene una Content Security Policy.');
if (!index.includes('<link rel="manifest" href="manifest.json">')) fail('MANIFEST_MISSING', 'Manifest PWA non collegato.');
if (!exists('manifest.json')) fail('MANIFEST_FILE_MISSING', 'manifest.json assente.');
if (!exists('icon-192.png') || !exists('icon-512.png')) fail('PWA_ICONS_MISSING', 'Icone locali 192/512 assenti.');
if (!exists('sw.js')) fail('SW_MISSING', 'Service worker assente.');

const envPos = index.indexOf('js/safety_env.js');
const supaPos = index.indexOf('js/supabase_config.js');
if (envPos === -1) fail('SAFETY_ENV_NOT_LOADED', 'js/safety_env.js non viene caricato in index.html.');
if (supaPos === -1) fail('SUPABASE_CONFIG_NOT_LOADED', 'js/supabase_config.js non viene caricato in index.html.');
if (envPos !== -1 && supaPos !== -1 && envPos > supaPos) fail('SAFETY_ENV_ORDER', 'js/safety_env.js deve essere caricato prima di js/supabase_config.js.');

if (!supabase.includes('window.SAFETY_SUPABASE_URL')) fail('SUPABASE_RUNTIME_CONFIG', 'supabase_config.js non usa window.SAFETY_SUPABASE_URL.');
if (/SUPABASE_SERVICE_ROLE/i.test(index + supabase)) fail('SERVICE_ROLE_NAME_IN_FRONTEND', 'Riferimento a SUPABASE_SERVICE_ROLE nel frontend.');

for (const f of cssFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  if (txt.includes('@apply')) fail('TAILWIND_APPLY_UNPROCESSED', `${path.relative(root, f)} contiene @apply non processato.`);
}

if (!/safetypro-v\d+/i.test(sw)) fail('SW_CACHE_VERSION', 'sw.js non contiene cache versionata safetypro-vN.');
if (/cache\.addAll\([\s\S]*https?:\/\//i.test(sw)) warn('SW_EXTERNAL_CACHE', 'sw.js sembra cacheare URL esterni: verificare CDN/Supabase.');

let inlineOnclick = 0;
let innerHTML = 0;
const htmlFiles = [path.join(root, 'index.html'), ...walk(path.join(root, 'modules'), f => f.endsWith('.html'))];
for (const f of [...jsFiles, ...htmlFiles]) {
  const txt = fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
  inlineOnclick += (txt.match(/onclick\s*=/g) || []).length;
  innerHTML += (txt.match(/\.innerHTML\s*=/g) || []).length;
}

if (inlineOnclick > 0) warn('INLINE_ONCLICK_PRESENT', `Sono presenti ${inlineOnclick} onclick inline. Da ridurre gradualmente con event delegation.`);
if (innerHTML > 0) warn('INNERHTML_PRESENT', `Sono presenti ${innerHTML} assegnazioni innerHTML. Sanificare sempre dati utente.`);

const report = {
  generated_at: new Date().toISOString(),
  ok: issues.length === 0,
  errors: issues,
  warnings,
  metrics: {
    js_files: jsFiles.length,
    css_files: cssFiles.length,
    inline_onclick_count: inlineOnclick,
    innerHTML_assignments: innerHTML
  }
};

if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'REPORT_STATIC_AUDIT_STEP39.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));

if (issues.length) process.exit(1);
