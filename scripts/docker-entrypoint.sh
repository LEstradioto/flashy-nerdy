#!/bin/sh

# Docker entrypoint script for Flashy Nerdy
# This script ensures that the flashcards directory is properly initialized

echo "🚀 Starting Flashy Nerdy..."

# Source directory for default flashcards inside the image
DATA_SRC="/app/data/flashcards"
# Target directory in the volume
DATA_DEST="/app/public/flashcards"

# Ensure the destination directory exists
mkdir -p "$DATA_DEST"

# Check if the source directory exists and has content
if [ -d "$DATA_SRC" ] && [ "$(ls -A "$DATA_SRC" 2>/dev/null)" ]; then
    echo "📚 Synchronizing flashcards with example data..."
    # Copy all files from source to destination.
    # -r: recursive
    # -u: update (only copy if source is newer than destination)
    # This prevents overwriting user-saved data (like FSRS files) if they are newer.
    cp -ru "$DATA_SRC"/* "$DATA_DEST"/
    echo "✅ Flashcards synchronized successfully"
else
    # If there's no source data, ensure a manifest exists so the app doesn't crash.
    if [ ! -f "$DATA_DEST/manifest.json" ]; then
        echo '{"files":[]}' > "$DATA_DEST/manifest.json"
        echo "✅ Empty manifest created"
    fi
fi

# Ensure proper permissions for the entire flashcards directory
chown -R nextjs:nodejs "$DATA_DEST"

echo "🎯 Starting Next.js application..."

# Start the Next.js application
exec "$@"