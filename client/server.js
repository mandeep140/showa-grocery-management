const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const port = 9823;
const hostname = '0.0.0.0';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

const certsDir = path.join(__dirname, 'certificates');
const httpsOptions = {
  key: fs.readFileSync(path.join(certsDir, 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(certsDir, 'localhost.pem')),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`> Client ready on https://localhost:${port}`);
  });
});