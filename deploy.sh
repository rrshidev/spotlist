#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "❌ .env file not found!"
  echo "   Copy .env.example to .env and fill in your values:"
  echo "   cp .env.example .env && nano .env"
  exit 1
fi

source .env

if [ -z "${DOMAIN:-}" ]; then
  echo "❌ DOMAIN is not set in .env"
  exit 1
fi

if [ -z "${SECRET_KEY:-}" ]; then
  echo "❌ SECRET_KEY is not set in .env"
  exit 1
fi

echo "🚀 Deploying SpotList to ${DOMAIN}..."
echo ""

echo "📦 Pulling latest code..."
git pull origin master

echo "🏗️  Building images..."
docker compose -f docker-compose.prod.yml build

echo "🔄 Starting services..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Done! SpotList is running at https://${DOMAIN}"
echo "   Check logs: docker compose -f docker-compose.prod.yml logs -f"
