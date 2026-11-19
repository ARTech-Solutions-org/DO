import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import next from "next";

const port = Number(process.env.PORT) || 3000;
const httpPort = Number(process.env.HTTP_PORT) || 3080;
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV === "development";

// Protect the process from dying on client socket drops (ECONNRESET, EPIPE, etc.)
process.on("uncaughtException", (err) => {
  if (err && (err.code === "ECONNRESET" || err.code === "EPIPE" || err.code === "ETIMEDOUT")) {
    return;
  }
  console.error("Unhandled process exception:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

const app = next({ dev, hostname, port });
await app.prepare();
const handle = app.getRequestHandler();

const keyPath = "./certificates/key.pem";
const certPath = "./certificates/cert.pem";

const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

if (!hasCerts) {
  const server = http.createServer((req, res) => handle(req, res));
  server.on("clientError", (err, socket) => {
    if (!socket.destroyed) socket.destroy();
  });
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
} else {
  const key = fs.readFileSync(keyPath);
  const cert = fs.readFileSync(certPath);

  // HTTPS Server on primary port 3000 (Secure Context for Camera & Tablet Kiosk)
  const httpsServer = https.createServer({ key, cert }, (req, res) => handle(req, res));

  httpsServer.on("clientError", (err, socket) => {
    if (err && (err.code === "ECONNRESET" || err.code === "EPIPE")) {
      return socket.destroy();
    }
    if (socket.writable) {
      try {
        socket.end(
          "HTTP/1.1 302 Found\r\n" +
          "Location: https://10.10.10.21:3000/\r\n" +
          "Connection: close\r\n\r\n"
        );
      } catch {
        socket.destroy();
      }
    } else {
      socket.destroy();
    }
  });

  httpsServer.on("tlsClientError", (err, socket) => {
    if (!socket.destroyed) socket.destroy();
  });

  httpsServer.listen(port, hostname, () => {
    console.log(`> DO PhotoBooth HTTPS ready: https://${hostname}:${port}`);
    console.log(`  Tablet Kiosk URL:          https://10.10.10.21:${port}`);
  });

  // Plain HTTP Server on port 3080 as backup
  const httpServer = http.createServer((req, res) => handle(req, res));
  httpServer.on("clientError", (err, socket) => {
    if (!socket.destroyed) socket.destroy();
  });
  httpServer.listen(httpPort, hostname, () => {
    console.log(`> DO PhotoBooth HTTP backup:  http://${hostname}:${httpPort}`);
  });
}
