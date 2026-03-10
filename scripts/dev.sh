#!/bin/bash
# Start both backend and frontend for local development
# Usage: ./scripts/dev.sh

set -e

echo "=== VC Reference Check Tool - Dev Server ==="
echo ""

# Check for .env
if [ ! -f .env ]; then
    echo "No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your ANTHROPIC_API_KEY for AI features."
    echo ""
fi

# Load env vars
export $(grep -v '^#' .env | xargs 2>/dev/null) || true

# Install backend deps if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Install frontend deps if needed
if [ ! -d frontend/node_modules ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "Starting backend on http://localhost:8000"
echo "Starting frontend on http://localhost:5173"
echo ""

# Run backend and frontend in parallel
uvicorn backend.main:app --reload --port 8000 &
BACKEND_PID=$!

cd frontend && npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
