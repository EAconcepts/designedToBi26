import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BUDGET_KB = 180;
const nextDir = path.resolve('.next');

function getGzipSize(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return zlib.gzipSync(content).length;
  } catch (err) {
    console.warn(`Could not read file for gzip check: ${filePath}`, err.message);
    return 0;
  }
}

function checkBundle() {
  const buildManifestPath = path.join(nextDir, 'build-manifest.json');
  if (!fs.existsSync(buildManifestPath)) {
    console.error('Error: .next/build-manifest.json not found. Run "next build" first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
  const chunks = new Set([...(manifest.rootMainFiles || [])]);

  // Scan index.html for scripts loaded by modern browsers (excluding noModule legacy polyfills)
  const indexHtmlPath = path.join(nextDir, 'server/app/index.html');
  if (fs.existsSync(indexHtmlPath)) {
    const html = fs.readFileSync(indexHtmlPath, 'utf8');
    // Match script tags without noModule attribute
    const matches = html.matchAll(
      /<script(?![^>]*\bnoModule\b)[^>]*src="\/_next\/(static\/chunks\/[^"]+\.js)"/g,
    );
    for (const match of matches) {
      if (match[1]) chunks.add(match[1]);
    }
  }

  let totalBytes = 0;
  console.log('Calculating modern first-load JS bundle size for root page (/):');

  for (const chunk of chunks) {
    const fullPath = path.join(nextDir, chunk);
    if (fs.existsSync(fullPath)) {
      const gzipped = getGzipSize(fullPath);
      totalBytes += gzipped;
      console.log(`  - ${chunk}: ${(gzipped / 1024).toFixed(2)} KB (gzip)`);
    }
  }

  const totalKb = totalBytes / 1024;
  console.log(`\nTotal First-Load JS for /: ${totalKb.toFixed(2)} KB (Budget: ${BUDGET_KB} KB)`);

  if (totalKb > BUDGET_KB) {
    console.error(
      `❌ Bundle check FAILED: ${totalKb.toFixed(2)} KB exceeds ${BUDGET_KB} KB limit!`,
    );
    process.exit(1);
  }

  console.log(`✅ Bundle check PASSED: within ${BUDGET_KB} KB budget.\n`);
}

checkBundle();
