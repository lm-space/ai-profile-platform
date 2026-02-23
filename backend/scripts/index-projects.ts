/**
 * Index Projects Script
 * Reads markdown files from projects directory and indexes them into the knowledge base
 * Usage: npx ts-node scripts/index-projects.ts <API_URL>
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const API_URL = process.argv[2] || 'http://localhost:8787';
const PROJECTS_DIR = '/Users/mozhi/projects/ai/cloudflare/twozao-stage/projects';

async function indexProjects() {
  console.log(`📚 Indexing projects from: ${PROJECTS_DIR}`);
  console.log(`🔗 API URL: ${API_URL}`);

  try {
    // Read all markdown files
    const files = readdirSync(PROJECTS_DIR)
      .filter(f => f.endsWith('.md') && f !== 'Readme.md' && f !== 'build.md' && f !== 'DEPLOYMENT_SUMMARY.md')
      .sort();

    console.log(`\n📖 Found ${files.length} project files to index:\n`);

    const documents = files.map(file => {
      const filePath = join(PROJECTS_DIR, file);
      const content = readFileSync(filePath, 'utf-8');
      const title = file.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ');

      console.log(`  ✓ ${file} (${Math.round(content.length / 1024)}KB)`);

      return {
        title,
        content,
        slug: file.replace(/\.md$/, '').toLowerCase()
      };
    });

    console.log(`\n🚀 Sending ${documents.length} documents to API...`);

    const response = await fetch(`${API_URL}/api/kb/index`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ API Error (${response.status}):`, error);
      process.exit(1);
    }

    const result = await response.json() as any;

    console.log(`\n✅ Indexing Complete!\n`);
    console.log(`   Documents indexed: ${result.indexed}`);

    result.results.forEach((r: any) => {
      const icon = r.status === 'created' ? '✨' : '🔄';
      console.log(`   ${icon} ${r.title}: ${r.chunks} chunks`);
    });

    // Fetch and display stats
    console.log(`\n📊 Knowledge Base Statistics:`);
    const statsResponse = await fetch(`${API_URL}/api/kb/stats`);
    const stats = await statsResponse.json() as any;

    console.log(`   Documents: ${stats.documents}`);
    console.log(`   Chunks: ${stats.chunks}`);
    console.log(`   Total Tokens: ${stats.totalTokens}`);

    console.log(`\n🎉 Ready to chat! Try asking about Ela's projects.`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

indexProjects();
