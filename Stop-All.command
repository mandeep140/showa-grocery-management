echo "Stopping Showa processes..."

pkill -f "next dev" 2>/dev/null
pkill -f "node server.js" 2>/dev/null

echo "Done. All Showa processes stopped."

osascript -e 'tell application "Terminal" to close front window' 2>/dev/null &
exit 0