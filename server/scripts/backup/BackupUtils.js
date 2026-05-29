const fs = require("fs");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function validateServer(server) {
  if (!server || !server.id || !server.path) {
    throw new Error("Servidor no válido");
  }

  if (!fs.existsSync(server.path)) {
    throw new Error("La ruta del servidor no existe");
  }
}

function getTimestamp() {
  return new Date()
    .toISOString()
    .replace("T", "_")
    .replace(/\..+/, "")
    .replace(/:/g, "-");
}

function sanitizeReason(reason) {
  return String(reason || "manual")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

module.exports = {
  ensureDir,
  validateServer,
  getTimestamp,
  sanitizeReason
};