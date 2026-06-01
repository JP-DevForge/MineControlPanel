const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set([
  "MineControlPanel",
  "logs",
  "libraries",
  "versions",
  "config",
  "mods",
  "plugins",
  "cache",
  "crash-reports",
  "backups",
  "minecontrol-data"
]);

function getDataDir(serverPath) {
  return path.join(serverPath, "minecontrol-data");
}

function getWorldsJsonPath(serverPath) {
  return path.join(getDataDir(serverPath), "worlds.json");
}

function getServerPropertiesPath(serverPath) {
  return path.join(serverPath, "server.properties");
}

function readJsonSafe(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Error leyendo ${filePath}: ${err.message}`);
    return fallback;
  }
}

function readServerProperties(serverPath) {
  const props = {};
  const propertiesPath = getServerPropertiesPath(serverPath);

  if (!fs.existsSync(propertiesPath)) {
    return props;
  }

  const content = fs.readFileSync(propertiesPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();

    props[key] = value;
  }

  return props;
}

function isMinecraftWorld(dirPath) {
  return (
    fs.existsSync(path.join(dirPath, "level.dat")) ||
    fs.existsSync(path.join(dirPath, "region"))
  );
}

function getFolderSize(dirPath) {
  let total = 0;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        total += getFolderSize(fullPath);
      } else {
        total += fs.statSync(fullPath).size;
      }
    }
  } catch (err) {
    console.error(`Error calculando tamaño de ${dirPath}: ${err.message}`);
  }

  return total;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function getWorldLastModified(dirPath) {
  try {
    return fs.statSync(dirPath).mtime.toISOString();
  } catch {
    return null;
  }
}

function getWorldFolders(serverPath) {
  if (!fs.existsSync(serverPath)) {
    return [];
  }

  const entries = fs.readdirSync(serverPath, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .filter(entry => !IGNORED_DIRS.has(entry.name))
    .map(entry => ({
      folder: entry.name,
      path: path.join(serverPath, entry.name),
      generated: isMinecraftWorld(path.join(serverPath, entry.name))
    }));
}

function syncWorlds(server) {
  if (!server?.path) {
    throw new Error("Servidor inválido: falta server.path");
  }

  const serverPath = server.path;
  const outputPath = getWorldsJsonPath(serverPath);

  console.log(`[WORLDS] Generando worlds.json para ${server.name || server.id}`);

  const props = readServerProperties(serverPath);
  const activeFolder = props["level-name"] || "world";

  const previousData = readJsonSafe(outputPath, {
    activeWorld: activeFolder,
    worlds: []
  });

  const previousWorldsMap = new Map();

  if (Array.isArray(previousData.worlds)) {
    for (const world of previousData.worlds) {
      previousWorldsMap.set(world.folder, world);
    }
  }

  const worldFolders = getWorldFolders(serverPath);

  const worlds = worldFolders.map(worldFolder => {
    const previous = previousWorldsMap.get(worldFolder.folder);
    const sizeBytes = getFolderSize(worldFolder.path);

return {
  id: previous?.id || worldFolder.folder,
  name: previous?.name || worldFolder.folder,
  folder: worldFolder.folder,
  path: worldFolder.path,
  seed: previous?.seed || "",
  active: worldFolder.folder === activeFolder,
  generated: worldFolder.generated,
  sizeBytes,
  sizeFormatted: formatBytes(sizeBytes),
  createdAt: previous?.createdAt || null,
  lastModifiedAt: getWorldLastModified(worldFolder.path)
};
  });

  const output = {
    serverId: server.id || null,
    activeWorld: activeFolder,
    worlds
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");

  console.log(`[WORLDS] Generado: ${outputPath}`);
  console.log(`[WORLDS] Mundos exportados: ${worlds.length}`);
  console.log(`[WORLDS] Mundo activo: ${activeFolder}`);

  return output;
}

function getWorlds(server) {
  if (!server?.path) {
    throw new Error("Servidor inválido: falta server.path");
  }

  const outputPath = getWorldsJsonPath(server.path);

  return readJsonSafe(outputPath, {
    serverId: server.id || null,
    activeWorld: "world",
    worlds: []
  });
}

module.exports = {
  syncWorlds,
  getWorlds
};