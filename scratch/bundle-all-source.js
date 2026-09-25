import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'all-source-code.txt');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  '.git',
  '.gemini',
  'scratch',
  '.system_generated',
]);

const EXCLUDED_FILES = new Set([
  'package-lock.json',
  'repo-tree.txt',
  'copilot-audit.txt',
  'source-audit.txt',
  'all-source-code.txt',
  'GIENI-audit.zip',
]);

const EXCLUDED_EXTENSIONS = new Set([
  '.map',
  '.tsbuildinfo',
  '.zip',
  '.log',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
]);

function shouldIncludeFile(relPath) {
  const normPath = relPath.replace(/\\/g, '/');
  const parts = normPath.split('/');

  // Check excluded directories
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part)) return false;
  }

  const filename = path.basename(normPath);

  // Check excluded files
  if (EXCLUDED_FILES.has(filename)) return false;

  // Never include .env files
  if (filename.startsWith('.env') || filename.includes('.env.')) return false;

  // Check excluded extensions
  const ext = path.extname(filename).toLowerCase();
  if (EXCLUDED_EXTENSIONS.has(ext)) return false;

  return true;
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        getAllFiles(fullPath, fileList);
      }
    } else if (entry.isFile()) {
      if (shouldIncludeFile(relPath)) {
        fileList.push(relPath.replace(/\\/g, '/'));
      }
    }
  }

  return fileList;
}

const allFiles = getAllFiles(ROOT_DIR);

// Sort files logically: Root files first, then docs, apps, packages, tests
allFiles.sort((a, b) => {
  const getScore = (p) => {
    if (!p.includes('/')) return 10;
    if (p.startsWith('docs/') || p.startsWith('.codescene/')) return 20;
    if (p.startsWith('apps/')) return 30;
    if (p.startsWith('packages/')) return 40;
    if (p.startsWith('tests/')) return 50;
    return 60;
  };
  const scoreA = getScore(a);
  const scoreB = getScore(b);
  if (scoreA !== scoreB) return scoreA - scoreB;
  return a.localeCompare(b);
});

console.log(`Found ${allFiles.length} source files to bundle.`);

let bundle = `================================================================================
GIENI OS — COMPLETE REPOSITORY SOURCE CODE BUNDLE
================================================================================
TOTAL FILES: ${allFiles.length}
GENERATED: ${new Date().toISOString()}
PLATFORM: Gieni OS (Probate Intelligence & Investigation Monorepo)

DIRECTORY STRUCTURE INCLUDED:
- Root Configs & Architecture Specs (AGENTS.md, PLAN.Md, .codescene, etc.)
- apps/web (Next.js 15 Operator Console, Client Portal, Auth, Server Actions)
- apps/workers (Cloud Run Worker Pipeline, Document AI, Seeder)
- packages/* (database, authz, evidence, control, scoring, resilience, qc, delivery, workflow, ownership, property, authority)
- tests/* (unit, integration, and security test suites)

FORMAT:
For every file:
===== FILE: <path> =====
<contents>
================================================================================

`;

for (const relPath of allFiles) {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  let content = fs.readFileSync(fullPath, 'utf-8');

  // Redact any accidental tokens/secrets matching patterns
  content = content.replace(/(CLERK_SECRET_KEY\s*=\s*)([^\r\n]+)/g, '$1[REDACTED]');
  content = content.replace(/(MONGODB_URI\s*=\s*)([^\r\n]+)/g, '$1[REDACTED]');

  bundle += `===== FILE: ${relPath} =====\n\n`;
  bundle += content;
  bundle += '\n\n';
}

fs.writeFileSync(OUTPUT_FILE, bundle, 'utf-8');

const stats = fs.statSync(OUTPUT_FILE);
console.log(`Successfully bundled ${allFiles.length} files into all-source-code.txt (${(stats.size / 1024).toFixed(1)} KB).`);
