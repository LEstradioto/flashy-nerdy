#!/bin/sh

# Docker entrypoint script for Flashy Nerdy
# This script ensures that the flashcards directory is properly initialized

echo "🚀 Starting Flashy Nerdy..."

# Check if public/flashcards is empty (new volume mount)
if [ ! -f "/app/public/flashcards/manifest.json" ]; then
    echo "📚 Initializing flashcards with example data..."

    # Copy example data from data/flashcards if it exists
    if [ -d "/app/data/flashcards" ] && [ "$(ls -A /app/data/flashcards 2>/dev/null)" ]; then
        cp -r /app/data/flashcards/* /app/public/flashcards/
        echo "✅ Example flashcards copied successfully"
    else
        # Create a basic manifest if no example data exists
        echo '{"files":[]}' > /app/public/flashcards/manifest.json
        echo "✅ Empty manifest created"
    fi
else
    echo "📚 Using existing flashcards data"
fi

# Ensure proper permissions
chown -R nextjs:nodejs /app/public/flashcards

echo "🎯 Starting Next.js application..."

# Start the Next.js application
exec "$@"