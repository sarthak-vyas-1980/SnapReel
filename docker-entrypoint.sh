#!/bin/sh
set -e

# Start bgutil PO Token HTTP server in background
echo "[INFO] 🔑 Starting bgutil PO Token server on port 4416..."
cd /app/bgutil-server
node build/main.js &
BGUTIL_PID=$!

# Give it a moment to initialize
sleep 3

# Check if it started successfully
if kill -0 $BGUTIL_PID 2>/dev/null; then
    echo "[SUCCESS] ✅ bgutil PO Token server is running (PID: $BGUTIL_PID)"
else
    echo "[WARN] ⚠️ bgutil PO Token server failed to start. Continuing without PO tokens..."
fi

# Start the worker (exec replaces shell so signals propagate to npm/node)
cd /app
exec npm run worker
