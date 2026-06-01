const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const ENV_PATH = path.join(__dirname, "../../.env");

function generateSecret() {
  return crypto.randomBytes(64).toString("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(32).toString("hex");

  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!password || !stored) return false;

  const [salt, originalHash] = stored.split(":");

  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(originalHash)
  );
}

function isConfigured() {
  return Boolean(
    process.env.JWT_SECRET &&
    process.env.PANEL_PASSWORD_HASH
  );
}

function setup(password) {
  if (isConfigured()) {
    throw new Error("El panel ya está configurado");
  }

  if (!password || password.length < 4) {
    throw new Error("La contraseña debe tener al menos 4 caracteres");
  }

  const envContent = [
    `JWT_SECRET=${generateSecret()}`,
    `PANEL_PASSWORD_HASH=${hashPassword(password)}`
  ].join("\n");

  fs.writeFileSync(ENV_PATH, envContent + "\n");

  require("dotenv").config({ path: ENV_PATH, override: true });
}

function createToken() {
  return jwt.sign(
    { app: "MineControlPanel" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function requireAuth(req, res, next) {
  if (!req.path.startsWith("/api")) {
    return next();
  }

  if (
    req.path === "/api/auth/status" ||
    req.path === "/api/auth/setup" ||
    req.path === "/api/auth/login"
  ) {
    return next();
  }

  try {
    const token = req.cookies?.mcp_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No autorizado"
      });
    }

    verifyToken(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: "Sesión inválida"
    });
  }
}

module.exports = {
  setup,
  isConfigured,
  verifyPassword,
  createToken,
  requireAuth
};