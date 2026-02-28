cd "$(dirname "$0")"

echo "========================================"
echo "  Showa Client — Starting (Dev)..."
echo "========================================"

cd client

echo ""
echo "   Starting Client on port 9823..."
echo "   Local:   http://localhost:9823"
echo "   Network: http://$(ipconfig getifaddr en0 2>/dev/null || echo '0.0.0.0'):9823"
echo ""
echo "Press Ctrl+C to stop."
echo ""


(sleep 2 && open https://localhost:9823) &

npm run dev