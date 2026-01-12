# OSChat - Quick Start Guide

## 🎯 Getting Started in 5 Minutes

This guide will help you get OSChat running on your local machine quickly.

### Step 1: Prerequisites Check

Make sure you have:
- ✅ Node.js 20+ (`node --version`)
- ✅ MongoDB running (`mongosh` or Docker)
- ✅ Git

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/oschat.git
cd oschat

# Install all dependencies (root + workspaces)
npm install
```

### Step 3: Setup MongoDB

**Option A: Using Docker (Recommended)**
```bash
docker run -d \
  --name oschat-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
  mongo:7.0
```

**Option B: Local MongoDB**
- Install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service

### Step 4: Configure Environment Variables

**Backend (.env file)**
```bash
cd apps/server
cp .env.example .env
```

Edit `apps/server/.env`:
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://admin:admin123@localhost:27017/oschat?authSource=admin
MONGODB_DB=oschat
WEB_ORIGIN=http://localhost:3000
JWT_SECRET=dev-secret-key-change-in-production
SESSION_SECRET=dev-session-key-change-in-production

# Optional: For Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

**Frontend (.env.local file)**
```bash
cd ../web
cp .env.example .env.local
```

Edit `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Step 5: Start Development Servers

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd oschat
npm run dev --workspace=@oschat/server
```

You should see:
```
server listening on :4000
[mongo] connected
```

**Terminal 2 - Frontend Server:**
```bash
cd oschat
npm run dev --workspace=@oschat/web
```

You should see:
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 6: Open the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000/health

## 🔐 Setting Up Google OAuth (Optional but Recommended)

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "OSChat"
3. Enable APIs: Go to "APIs & Services" → "Enable APIs and Services"
4. Search for "Google+ API" and enable it

### 2. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Configure consent screen if prompted
4. Application type: "Web application"
5. Name: "OSChat Dev"
6. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:4000`
7. Authorized redirect URIs:
   - `http://localhost:4000/api/auth/google/callback`
8. Click "Create"
9. Copy the Client ID and Client Secret
10. Add them to your `apps/server/.env` file

### 3. Test OAuth Login

1. Restart your backend server
2. Go to http://localhost:3000
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected back and logged in!

## 🐳 Using Docker Compose (Alternative Method)

If you prefer using Docker for everything:

```bash
# Create .env file in project root
cp .env.example .env

# Edit .env with your Google OAuth credentials (optional)

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- MongoDB: localhost:27017

## 🧪 Testing the Application

### Test Real-time Chat

1. Open http://localhost:3000 in two browser windows (or use incognito mode)
2. Sign in with Google in both (or use the legacy interface)
3. Search for users and start a conversation
4. Type messages and see them appear in real-time!
5. Test typing indicators by typing without sending

### Test Features

- ✅ User authentication
- ✅ 1-on-1 chat
- ✅ Group chat
- ✅ Real-time messaging
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Message history
- ✅ User search
- ✅ Profile settings

## 🚀 Next Steps

### For Development

1. **Add more features**: File uploads, emojis, reactions
2. **Improve UI**: Add animations, themes, responsiveness
3. **Add tests**: Unit tests, integration tests, E2E tests
4. **Performance**: Add Redis caching, optimize queries

### For Production

1. **Security**: 
   - Change JWT_SECRET and SESSION_SECRET
   - Enable rate limiting
   - Add input validation
   - Setup HTTPS

2. **Monitoring**:
   - Setup Prometheus + Grafana
   - Configure logging (Winston, Pino)
   - Add error tracking (Sentry)

3. **Deployment**:
   - Follow Kubernetes deployment guide
   - Setup CI/CD with Jenkins
   - Configure domain and SSL certificates

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps | grep mongo

# View MongoDB logs
docker logs oschat-mongo

# Restart MongoDB
docker restart oschat-mongo
```

### Port Already in Use

```bash
# Find process using port 3000 or 4000
lsof -i :3000
lsof -i :4000

# Kill the process
kill -9 <PID>
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules
rm -rf apps/server/node_modules
rm -rf apps/web/node_modules
npm install
```

### Socket.IO Connection Issues

1. Check CORS settings in `apps/server/src/app.js`
2. Verify WEB_ORIGIN matches your frontend URL
3. Check browser console for errors
4. Ensure both servers are running

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Passport.js Documentation](http://www.passportjs.org/docs/)

## 💬 Getting Help

- Open an issue on GitHub
- Check existing issues for solutions
- Review the main README.md for detailed documentation

---

**Happy Coding! 🎉**
