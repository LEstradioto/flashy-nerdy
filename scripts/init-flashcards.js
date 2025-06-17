#!/usr/bin/env node

/**
 * Initialize flashcards for serverless or local builds.
 * Ensures that `data/flashcards` exists and contains at least an empty manifest.
 * (For Docker images we later copy these seed files into `/app/default-flashcards`.)
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), 'data', 'flashcards');
const targetDir = path.join(process.cwd(), 'data', 'flashcards');

console.log('🚀 Initializing flashcards data...');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('📁 Created data/flashcards directory');
}

// If a manifest already exists, nothing to do
if (fs.existsSync(path.join(targetDir, 'manifest.json'))) {
  console.log('📚 Flashcards already initialized, skipping...');
  process.exit(0);
}

// Otherwise create an empty manifest so the app boots without errors.
if (!fs.existsSync(path.join(targetDir, 'manifest.json'))) {
  const emptyManifest = { files: [] };
  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(emptyManifest, null, 2)
  );
  console.log('📝 Created empty manifest.json');
}

console.log('✨ Flashcards initialization complete!');