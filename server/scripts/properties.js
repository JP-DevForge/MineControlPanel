const fs = require("fs");
const path = require("path");

const DEFAULT_MINECRAFT_MOTD = "A Minecraft Server";

function getPropertiesPath(serverPath) {
  return path.join(serverPath, "server.properties");
}

function parseValue(value) {
  const cleanValue = String(value).trim();

  if (cleanValue === "true") return true;
  if (cleanValue === "false") return false;

  if (!Number.isNaN(Number(cleanValue)) && cleanValue !== "") {
    return Number(cleanValue);
  }

  return value;
}

function normalizeMotd(value) {
  return String(value || "")
    .trim()
    .replace(/\\u00A7/g, "§");
}

function readProperties(serverPath) {
  const file = getPropertiesPath(serverPath);

  if (!fs.existsSync(file)) {
    throw new Error("No existe server.properties");
  }

  const content = fs.readFileSync(file, "utf8");
  const properties = {};

  content.split(/\r?\n/).forEach(line => {
    const clean = line.trim();

    if (!clean || clean.startsWith("#")) return;

    const index = clean.indexOf("=");

    if (index === -1) return;

    const key = clean.slice(0, index).trim();
    const value = clean.slice(index + 1);

    properties[key] = parseValue(value);
  });

  return properties;
}

function saveProperties(serverPath, newProperties) {
  const file = getPropertiesPath(serverPath);

  if (!fs.existsSync(file)) {
    throw new Error("No existe server.properties");
  }

  const content = fs.readFileSync(file, "utf8");
  const existingKeys = new Set();

  const updatedLines = content.split(/\r?\n/).map(line => {
    const clean = line.trim();

    if (!clean || clean.startsWith("#") || !clean.includes("=")) {
      return line;
    }

    const key = clean.slice(0, clean.indexOf("=")).trim();

    existingKeys.add(key);

    if (!(key in newProperties)) {
      return line;
    }

    return `${key}=${newProperties[key]}`;
  });

  Object.entries(newProperties).forEach(([key, value]) => {
    if (!existingKeys.has(key)) {
      updatedLines.push(`${key}=${value}`);
    }
  });

  fs.writeFileSync(file, updatedLines.join("\n"), "utf8");
}

function buildDefaultMotd(server) {
  return `${server.name} administrado con MineControlPanel`;
}

function ensureDefaultMotd(server) {
  const current = readProperties(server.path);
  const currentMotd = normalizeMotd(current.motd);

  if (
    currentMotd &&
    currentMotd !== DEFAULT_MINECRAFT_MOTD
  ) {
    return currentMotd;
  }

  const motd = buildDefaultMotd(server);

  saveProperties(server.path, {
    ...current,
    motd
  });

  return motd;
}

function getMotd(server) {
  const current = readProperties(server.path);
  return normalizeMotd(current.motd);
}
function saveProperty(serverPath, key, value) {
  const current = readProperties(serverPath);

  saveProperties(serverPath, {
    ...current,
    [key]: value
  });
}
module.exports = {
  readProperties,
  saveProperties,
  saveProperty,
  normalizeMotd,
  buildDefaultMotd,
  ensureDefaultMotd,
  getMotd
};