const fs = require("fs");
const path = require("path");

function getPropertiesPath(serverPath) {
  return path.join(serverPath, "server.properties");
}

function parseValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;

  if (!Number.isNaN(Number(value)) && value.trim() !== "") {
    return Number(value);
  }

  return value;
}

function readProperties(serverPath) {
  const file = getPropertiesPath(serverPath);

  if (!fs.existsSync(file)) {
    throw new Error("No existe server.properties");
  }

  const content = fs.readFileSync(file, "utf8");
  const properties = {};

  content.split("\n").forEach(line => {
    const clean = line.trim();

    if (!clean || clean.startsWith("#")) return;

    const index = clean.indexOf("=");

    if (index === -1) return;

    const key = clean.slice(0, index);
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

  const updatedLines = content.split("\n").map(line => {
    const clean = line.trim();

    if (!clean || clean.startsWith("#") || !clean.includes("=")) {
      return line;
    }

    const key = clean.slice(0, clean.indexOf("="));

    if (!(key in newProperties)) {
      return line;
    }

    return `${key}=${newProperties[key]}`;
  });

  fs.writeFileSync(file, updatedLines.join("\n"), "utf8");
}

module.exports = {
  readProperties,
  saveProperties
};