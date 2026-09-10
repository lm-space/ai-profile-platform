#!/usr/bin/env node
/**
 * Knowledge Base indexer.
 *
 * Reads every .md file under backend/kb/, parses its frontmatter, and POSTs
 * the batch to /api/kb/index. The endpoint upserts by slug, so re-running is
 * safe and idempotent — edit a file, re-run, done.
 *
 * This replaces the old index-kb-tiered.sh, which held all KB prose inside a
 * bash heredoc. Content that lives in a heredoc can't be diffed, reviewed, or
 * grown; content in files can.
 *
 * Frontmatter (all required except category):
 *   ---
 *   title: Ela - About Me & Profile
 *   slug: ela-profile
 *   category: profile
 *   tier: 1
 *   ---
 *
 * TIERS — this is the retrieval contract, not a filing system:
 *   1  Always injected into every prompt. Keep it tight; it costs tokens on
 *      every single message. Identity, core skills, positioning.
 *   2  Injected when the topic matches. Indexes, summaries, approach docs.
 *   3  Retrieved by semantic search only. Deep case studies and topic deep-dives.
 *
 * Usage:
 *   node scripts/index-kb.mjs [api-base-url] [--dry-run]
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const KB_DIR = join(HERE, '..', 'kb');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const apiBase = args.find(a => !a.startsWith('--')) || 'https://elamurugan-api.rugan.workers.dev';
const endpoint = `${apiBase}/api/kb/index`;

/** Minimal frontmatter parser — scalar key: value pairs only, which is all we need. */
function parseFrontmatter(raw, file) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing --- frontmatter block`);

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) throw new Error(`${file}: bad frontmatter line: ${line}`);
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
  return { meta, body: match[2].trim() };
}

const files = (await readdir(KB_DIR)).filter(f => f.endsWith('.md')).sort();
if (files.length === 0) {
  console.error(`No .md files found in ${KB_DIR}`);
  process.exit(1);
}

const documents = [];
const errors = [];

for (const file of files) {
  try {
    const { meta, body } = parseFrontmatter(await readFile(join(KB_DIR, file), 'utf8'), file);

    for (const required of ['title', 'slug', 'tier']) {
      if (!meta[required]) throw new Error(`${file}: frontmatter missing '${required}'`);
    }

    const tier = Number(meta.tier);
    if (![1, 2, 3].includes(tier)) throw new Error(`${file}: tier must be 1, 2 or 3 (got '${meta.tier}')`);
    if (!body) throw new Error(`${file}: body is empty`);

    documents.push({
      title: meta.title,
      slug: meta.slug,
      category: meta.category || 'general',
      tier,
      content: body
    });
  } catch (err) {
    errors.push(err.message);
  }
}

// Duplicate slugs would silently overwrite each other during the upsert.
const seen = new Map();
for (const doc of documents) {
  if (seen.has(doc.slug)) errors.push(`duplicate slug '${doc.slug}'`);
  seen.set(doc.slug, true);
}

if (errors.length) {
  console.error('KB validation failed:\n' + errors.map(e => `  - ${e}`).join('\n'));
  process.exit(1);
}

const byTier = t => documents.filter(d => d.tier === t);
const words = docs => docs.reduce((n, d) => n + d.content.split(/\s+/).length, 0);

console.log(`=== Knowledge Base: ${documents.length} documents ===`);
for (const t of [1, 2, 3]) {
  const docs = byTier(t);
  console.log(`  Tier ${t}: ${String(docs.length).padStart(2)} docs, ~${words(docs).toLocaleString()} words`);
}
// Tier 1 rides along on every single request — worth watching.
console.log(`\nTier-1 always-on context: ~${Math.round(words(byTier(1)) * 1.35).toLocaleString()} tokens/request`);

if (dryRun) {
  console.log('\n--dry-run: validated only, nothing sent.');
  for (const d of documents) console.log(`  [T${d.tier}] ${d.slug.padEnd(34)} ${d.title}`);
  process.exit(0);
}

console.log(`\nPOST ${endpoint}`);

// Batch so a large KB doesn't hit request-size or subrequest limits.
const BATCH = 4;
let indexed = 0;

for (let i = 0; i < documents.length; i += BATCH) {
  const batch = documents.slice(i, i + BATCH);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documents: batch })
  });

  const text = await res.text();
  if (!res.ok) {
    console.error(`  ✗ batch ${i / BATCH + 1} failed (${res.status}): ${text.slice(0, 300)}`);
    process.exit(1);
  }

  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = null; }
  for (const r of parsed?.results || []) {
    console.log(`  ✓ [T${r.tier}] ${r.slug} — ${r.chunks} chunks (${r.status})`);
    indexed++;
  }
}

console.log(`\n✅ Indexed ${indexed}/${documents.length} documents.`);
console.log(`Verify: curl ${apiBase}/api/kb/stats`);
