// server.js — minimal static file server for the built dist/ directory.
// Meant to sit behind a reverse proxy or tunnel (nginx/Caddy/Cloudflare Tunnel)
// pointed at http://HOST:PORT. Run `node build.js` first to (re)generate dist/.
//
//   PORT=8137 node server.js
//
// No dependencies — Node's built-in http/fs/path only.

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 8137;
const HOST = process.env.HOST || "127.0.0.1";
const ROOT = path.join(__dirname, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

if (!fs.existsSync(ROOT)) {
  console.error(`✗ ${ROOT} does not exist — run "node build.js" first.`);
  process.exit(1);
}

/** Resolve a request path to a file inside ROOT, or null if it escapes ROOT. */
function resolvePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const resolved = path.normalize(path.join(ROOT, decoded));
  // Prevent path traversal: the result must stay within ROOT.
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) return null;
  return resolved;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function serveFile(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 500, "500 Internal Server Error");
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    send(res, 200, data, { "content-type": type });
  });
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, "405 Method Not Allowed", { allow: "GET, HEAD" });
  }

  let file = resolvePath(req.url);
  if (file === null) return send(res, 403, "403 Forbidden");

  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) {
      const indexFile = path.join(file, "index.html");
      return fs.stat(indexFile, (e2) =>
        e2 ? serve404(res) : serveFile(res, indexFile)
      );
    }
    if (!err && stat.isFile()) return serveFile(res, file);
    serve404(res);
  });
});

function serve404(res) {
  const custom = path.join(ROOT, "404.html");
  fs.readFile(custom, (err, data) => {
    if (err) return send(res, 404, "404 Not Found", { "content-type": "text/plain" });
    send(res, 404, data, { "content-type": "text/html; charset=utf-8" });
  });
}

server.listen(PORT, HOST, () => {
  console.log(`portfolio: serving ${ROOT} at http://${HOST}:${PORT}`);
});
