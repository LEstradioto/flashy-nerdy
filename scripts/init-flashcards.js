#!/usr/bin/env node

/**
 * Initialize flashcards for serverless deployments (Vercel/Netlify)
 * This script copies example data from data/flashcards to public/flashcards
 * Run this during the build process for serverless platforms
 */

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), 'data', 'flashcards');
const targetDir = path.join(process.cwd(), 'public', 'flashcards');

console.log('🚀 Initializing flashcards for serverless deployment...');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
  console.log('📁 Created public/flashcards directory');
}

// Check if target already has data (don't overwrite)
if (fs.existsSync(path.join(targetDir, 'manifest.json'))) {
  console.log('📚 Flashcards already initialized, skipping...');
  process.exit(0);
}

// Copy files from source to target
if (fs.existsSync(sourceDir)) {
  const files = fs.readdirSync(sourceDir);

  files.forEach(file => {
    const sourcePath = path.join(sourceDir, file);
    const targetPath = path.join(targetDir, file);

    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied ${file}`);
    }
  });

  console.log(`🎉 Successfully initialized ${files.length} flashcard files`);
} else {
  // Create empty manifest if no source data
  const emptyManifest = { files: [] };
  fs.writeFileSync(
    path.join(targetDir, 'manifest.json'),
    JSON.stringify(emptyManifest, null, 2)
  );
  console.log('📝 Created empty manifest.json');
}

console.log('✨ Flashcards initialization complete!');