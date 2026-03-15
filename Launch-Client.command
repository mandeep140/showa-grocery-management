DIR="$(cd "$(dirname "$0")" && pwd)"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh" 2>/dev/null

mkdir -p "$DIR/logs"

cd "$DIR/client"
nohup npm start >> "$DIR/logs/client.log" 2>&1 &
disown

(sleep 3 && open "https://localhost:9823") &
disown

osascript -e 'tell application "Terminal" to close front window' 2>/dev/null &
exit 0