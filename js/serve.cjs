"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function createServer() {
  return http.createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405, { Allow: "GET, HEAD" });
      return res.end();
    }
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }
    if (pathname.includes("\0")) {
      res.writeHead(400);
      return res.end("Bad request");
    }
    if (pathname === "/") pathname = "/index.html";
    const file = path.resolve(root, "." + pathname);
    const relative = path.relative(root, file);
    const parts = relative.split(path.sep);
    // Serve public website files, never repository metadata or local configuration.
    if (relative.startsWith("..") || path.isAbsolute(relative) ||
        parts.some(part => part.startsWith(".")) ||
        !(relative === "index.html" || ["frontend", "css", "js", "assets"].includes(parts[0])) ||
        !mime[path.extname(file)]) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    fs.readFile(file, (error, data) => {
      if (error) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)],
        "Content-Length": data.length,
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    });
  });
}

if (require.main === module) {
  createServer().listen(4173, "127.0.0.1", () => {
    console.log("Preview: http://127.0.0.1:4173");
  });
}
module.exports = { createServer };
