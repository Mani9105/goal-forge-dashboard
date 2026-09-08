#!/bin/bash

export OLLAMA_HOST=http://localhost:11434
export GOALFORGE_MODEL_ID=qwen2.5:1.5b

echo "Starting Ollama..."
ollama serve > /tmp/ollama.log 2>&1 &

sleep 3

echo "Starting GoalForge backend..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000
