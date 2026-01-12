#!/bin/bash

# OSChat Development Servers Starter
# Starts both backend and frontend servers

echo "🚀 Starting OSChat Development Servers..."
echo ""

# Check if running in tmux or screen
if [ -n "$TMUX" ]; then
    echo "📺 Using tmux..."
    
    # Create new window for backend
    tmux new-window -n "OSChat-Backend" "cd $(pwd) && npm run dev --workspace=@oschat/server"
    
    # Create new window for frontend
    tmux new-window -n "OSChat-Frontend" "cd $(pwd) && npm run dev --workspace=@oschat/web"
    
    echo "✅ Servers started in tmux windows"
    echo "   Switch with Ctrl+B then number"
    
elif command -v gnome-terminal >/dev/null 2>&1; then
    echo "🖥️  Using gnome-terminal..."
    
    gnome-terminal --tab --title="Backend" -- bash -c "npm run dev --workspace=@oschat/server; exec bash"
    gnome-terminal --tab --title="Frontend" -- bash -c "npm run dev --workspace=@oschat/web; exec bash"
    
    echo "✅ Servers started in new tabs"
    
elif command -v osascript >/dev/null 2>&1; then
    echo "🍎 Using macOS Terminal..."
    
    osascript <<EOF
tell application "Terminal"
    do script "cd $(pwd) && npm run dev --workspace=@oschat/server"
    do script "cd $(pwd) && npm run dev --workspace=@oschat/web"
end tell
EOF
    
    echo "✅ Servers started in new Terminal windows"
    
else
    echo "⚠️  Could not detect terminal multiplexer"
    echo ""
    echo "Please start the servers manually in two terminals:"
    echo ""
    echo "Terminal 1:"
    echo "$ npm run dev --workspace=@oschat/server"
    echo ""
    echo "Terminal 2:"
    echo "$ npm run dev --workspace=@oschat/web"
    exit 1
fi

echo ""
echo "🌐 Application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:4000"
echo ""
echo "💡 Press Ctrl+C in each terminal to stop the servers"
