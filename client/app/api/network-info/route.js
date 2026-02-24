import os from 'os'

export async function GET() {
  const nets = os.networkInterfaces()
  let localIp = null

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address
        break
      }
    }
    if (localIp) break
  }

  return Response.json({ ip: localIp || '127.0.0.1' })
}
