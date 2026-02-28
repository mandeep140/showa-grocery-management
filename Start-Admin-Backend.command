cd "$(dirname "$0")"

echo "========================================"
echo "  Showa Admin + Backend — Starting (Dev)..."
echo "========================================"

IP=$(ipconfig getifaddr en0 2>/dev/null || echo '0.0.0.0')

# Start Backend in background
echo "🔧 Starting Backend on port 24034..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

sleep 1
echo " Backend running (PID: $BACKEND_PID)"

cd admin

echo ""
echo " Starting Admin on port 9824..."
echo ""
echo "   Backend: http://$IP:24034"
echo "   Admin:   http://localhost:9824"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

# Trap Ctrl+C to kill backend too
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID 2>/dev/null; exit 0" INT TERM

(sleep 2 && open http://localhost:9824) &

npm run dev

# Cleanup backend when admin stops
kill $BACKEND_PID 2>/dev/null