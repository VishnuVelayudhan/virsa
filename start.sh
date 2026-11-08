#!/bin/bash
set -e

APP_DIR="${APP_DIR:-$(pwd)}"
echo "Application directory: $APP_DIR"

echo "=========================================="
echo "Starting OcuNet AI Service (Flask :5000)..."
echo "=========================================="
cd "$APP_DIR/OcuNet-main"
python3 models/app_api.py &

echo "Waiting for OcuNet AI service to initialize..."
sleep 4

echo "=========================================="
echo "Starting VIRSA Web Application..."
echo "=========================================="
cd "$APP_DIR"
node server.js
