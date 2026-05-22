const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const publicDir = __dirname;
const port = Number(process.env.PORT) || 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

const server = http.createServer((request, response) => {
  const safeUrl = decodeURIComponent(request.url.split("?")[0]);
  const requestedPath = safeUrl === "/" ? "/index.html" : safeUrl;
  const filePath = path.normalize(path.join(publicDir, requestedPath));
  const relativePath = path.relative(publicDir, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    send(response, 403, "text/plain; charset=utf-8", "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(response, 404, "text/html; charset=utf-8", fs.readFileSync(path.join(publicDir, "index.html")));
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    send(response, 200, mimeTypes[extension] || "application/octet-stream", content);
  });
});

server.listen(port, () => {
  console.log(`NexoCash running on http://localhost:${port}`);
});

function send(response, statusCode, contentType, content) {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  response.end(content);
}
