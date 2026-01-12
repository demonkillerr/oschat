#!/bin/bash

# OSChat Quick Start Script
# This script helps you get started quickly with OSChat

set -e

echo "🚀 OSChat Quick Start"
echo "===================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Install from https://nodejs.org/"; exit 1; }
echo "✅ Node.js $(node --version)"

command -v npm >/dev/null 2>&1 || { echo "❌ npm is required"; exit 1; }
echo "✅ npm $(npm --version)"

command -v docker >/dev/null 2>&1 && echo "✅ Docker $(docker --version)" || echo "⚠️  Docker not found (optional)"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Starting MongoDB with Docker..."
if command -v docker >/dev/null 2>&1; then
    if docker ps | grep -q oschat-mongo; then
        echo "✅ MongoDB already running"
    else
        docker run -d \
            --name oschat-mongo \
            -p 27017:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=admin \
            -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
            mongo:7.0
        echo "✅ MongoDB started"
        sleep 3
    fi
else
    echo "⚠️  Docker not available. Please start MongoDB manually on port 27017"
fi

echo ""
echo "⚙️  Setting up environment files..."

# Server .env
if [ ! -f apps/server/.env ]; then
    cat > apps/server/.env << 'EOF'
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://admin:admin123@localhost:27017/oschat?authSource=admin
MONGODB_DB=oschat
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=dev-secret-key-change-in-production
SESSION_SECRET=dev-session-key-change-in-production
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
EOF
    echo "✅ Created apps/server/.env"
else
    echo "✅ apps/server/.env already exists"
fi

# Web .env.local
if [ ! -f apps/web/.env.local ]; then
    cat > apps/web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
EOF
    echo "✅ Created apps/web/.env.local"
else
    echo "✅ apps/web/.env.local already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. (Optional) Setup Google OAuth:"
echo "   - Go to https://console.cloud.google.com/"
echo "   - Create OAuth credentials"
echo "   - Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to apps/server/.env"
echo ""
echo "2. Start the servers in two terminals:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   $ npm run dev --workspace=@oschat/server"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   $ npm run dev --workspace=@oschat/web"
echo ""
echo "3. Open your browser:"
echo "   🌐 http://localhost:3000"
echo ""
echo "Or use the start-dev.sh script to start both servers!"
echo ""
echo "📚 Documentation:"
echo "   - SETUP.md - Detailed setup guide"
echo "   - README.md - Full documentation"
echo "   - DEPLOYMENT.md - Production deployment"
echo ""
echo "Happy coding! 🎉"
