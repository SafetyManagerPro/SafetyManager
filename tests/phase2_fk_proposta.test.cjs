'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sqlFile = path.resolve(__dirname, '../supabase/manual/FASE2_REVIEW_ONLY_progetti_azienda_delete_restrict_2026-10-27.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');
const operations = sql.split('\n').filter(line => !line.trimStart().startsWith('--')).join('\n');

test('proposta di hardening solo manuale: transazione atomica e limiti di attesa', () => {
  assert.match(sql, /NON APPLICATA/);
  assert.match(operations, /\bBEGIN;/);
  assert.match(operations, /SET LOCAL lock_timeout\s*=/);
  assert.match(operations, /SET LOCAL statement_timeout\s*=/);
  assert.match(operations, /\bCOMMIT;/);
});

test('preflight richiede FK esatta CASCADE, validata e non deferrable', () => {
  assert.match(operations, /c\.conname\s*=\s*'progetti_azienda_id_fkey'/);
  assert.match(operations, /c\.conrelid\s*=\s*'public\.progetti'::regclass/);
  assert.match(operations, /c\.confrelid\s*=\s*'public\.aziende'::regclass/);
  assert.match(operations, /current_delete_action IS DISTINCT FROM 'c'/);
  assert.match(operations, /current_validated IS DISTINCT FROM true/);
  assert.match(operations, /current_deferrable IS DISTINCT FROM false/);
  assert.match(operations, /p\.azienda_id IS NOT NULL AND a\.id IS NULL/);
});

test('modifica solo FK progetti→aziende da CASCADE a RESTRICT senza mutare dati', () => {
  assert.match(operations, /ALTER TABLE public\.progetti\s+DROP CONSTRAINT progetti_azienda_id_fkey,/);
  assert.match(operations, /ADD CONSTRAINT progetti_azienda_id_fkey\s+FOREIGN KEY \(azienda_id\)/);
  assert.match(operations, /REFERENCES public\.aziende\(id\)[\s\S]*?ON DELETE RESTRICT/);
  assert.match(operations, /NOT DEFERRABLE;/);
  assert.doesNotMatch(operations, /\b(?:INSERT INTO|DELETE FROM|UPDATE public\.|TRUNCATE|DROP TABLE|DROP COLUMN)\b/i);
  const alterStatements = [...operations.matchAll(/\bALTER TABLE\b/g)];
  assert.equal(alterStatements.length, 1);
});
