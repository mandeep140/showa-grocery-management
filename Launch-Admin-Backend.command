DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" 2>/dev/null

mkdir -p "$DIR/logs"

# Start backend
cd "$DIR/backend"
nohup node server.js >> "$DIR/logs/backend.log" 2>&1 &
disown

# Start admin dev server
cd "$DIR/admin"
nohup npm run dev >> "$DIR/logs/admin.log" 2>&1 &
disown

(sleep 3 && open "http://localhost:9824") &
disown

osascript -e 'tell application "Terminal" to close front window' 2>/dev/null &
exit 0