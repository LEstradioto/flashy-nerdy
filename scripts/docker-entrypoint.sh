#!/bin/sh

# Docker entrypoint script for Flashy Nerdy
# This script ensures that the flashcards directory is properly initialized

echo "🚀 Starting Flashy Nerdy..."

# Source directory for default flashcards inside the image (read-only)
DATA_SRC="/app/default-flashcards"
# Target directory where runtime data is kept (mounted volume)
DATA_DEST="/app/data/flashcards"

# Ensure the destination directory exists
mkdir -p "$DATA_DEST"

# If destination is empty, seed it with example decks
if [ -d "$DATA_SRC" ] && [ ! "$(ls -A "$DATA_DEST" 2>/dev/null)" ]; then
    echo "📚 Initialising flashcards data directory with default decks..."
    cp -r "$DATA_SRC"/* "$DATA_DEST"/
    echo "✅ Flashcards initialised"
else
    # If there's no source data, ensure a manifest exists so the app doesn't crash.
    if [ ! -f "$DATA_DEST/manifest.json" ]; then
        echo '{"files":[]}' > "$DATA_DEST/manifest.json"
        echo "✅ Empty manifest created"
    fi
fi

# Ensure proper permissions for the entire flashcards directory (ignore if fails on non-root envs)
chown -R nextjs:nodejs "$DATA_DEST" 2>/dev/null || true

echo "🎯 Starting Next.js application..."

# Start the Next.js application
exec "$@"