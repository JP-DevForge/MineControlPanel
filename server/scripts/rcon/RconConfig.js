const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function readProperties(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const props = {};

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");

    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();

    props[key] = value;
  }

  return props;
}

function writeProperties(filePath, updates) {
  const lines = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8").split(/\r?\n/)
    : [];

  const usedKeys = new Set();

  const newLines = lines.map(line => {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      return line;
    }

    const key = trimmed.split("=")[0].trim();

    if (updates[key] === undefined) {
      return line;
    }

    usedKeys.add(key);
    return `${key}=${updates[key]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!usedKeys.has(key)) {
      newLines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(filePath, newLines.join("\n"), "utf8");
}

function generateRconPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

function ensureRconConfig(server) {
  const propertiesPath = path.join(server.path, "server.properties");

  const props = readProperties(propertiesPath);

  const password =
    server.rcon?.password ||
    props["rcon.password"] ||
    generateRconPassword();

  const port =
    server.rcon?.port ||
    Number(props["rcon.port"]) ||
    25575;

  writeProperties(propertiesPath, {
    "enable-rcon": "true",
    "rcon.port": String(port),
    "rcon.password": password
  });

  return {
    ...server,
    rcon: {
      enabled: true,
      host: server.rcon?.host || "127.0.0.1",
      port,
      password
    }
  };
}
const serversJSON = require("../syncjson/ServersJSON");

function getFreeRconPort(currentServerId = null) {
  const servers = serversJSON.getServers();

  const usedPorts = new Set(
    servers
      .filter(server => server.id !== currentServerId)
      .map(server => Number(server.rconPort))
      .filter(Boolean)
  );

  let port = 25575;

  while (usedPorts.has(port)) {
    port++;
  }

  return port;
}
module.exports = {
  ensureRconConfig,
  getFreeRconPort
};