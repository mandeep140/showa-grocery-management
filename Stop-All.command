echo "Stopping Showa processes..."

# Kill by port - guaranteed cleanup
lsof -ti:9823 | xargs kill -9 2>/dev/null
lsof -ti:9824 | xargs kill -9 2>/dev/null
lsof -ti:24034 | xargs kill -9 2>/dev/null

echo "Done. All Showa processes stopped."

osascript -e 'tell application "Terminal" to close front window' 2>/dev/null &
exit 0