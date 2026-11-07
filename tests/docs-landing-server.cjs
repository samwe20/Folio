const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../docs");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json",
};

function createDocsLandingServer() {
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let relative = decodeURIComponent(url.pathname);
      if (relative.endsWith("/")) relative += "index.html";
      if (relative === "/") relative = "/index.html";
      const target = path.resolve(root, "." + relative);
      if (!target.startsWith(root + path.sep) && target !== root) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = fs.readFileSync(target);
      res.setHeader("Content-Type", types[path.extname(target)] || "application/octet-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
}

module.exports = { createDocsLandingServer, docsRoot: root };
