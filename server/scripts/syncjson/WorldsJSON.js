const fs = require("fs");
const path = require("path");

const SERVER_ROOT = path.join(__dirname, "..", "..");

const SERVER_PROPERTIES_PATH = path.join(SERVER_ROOT, "server.properties");
const OUTPUT_PATH = path.join(__dirname, "..", "js", "API", "worlds.json");

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
    "backups"
]);

function readJsonSafe(filePath, fallback = null) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch (err) {
        console.error(`Error leyendo ${filePath}: ${err.message}`);
        return fallback;
    }
}

function readServerProperties() {
    const props = {};

    if (!fs.existsSync(SERVER_PROPERTIES_PATH)) {
        return props;
    }

    const content = fs.readFileSync(SERVER_PROPERTIES_PATH, "utf8");
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
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
    const levelDat = path.join(dirPath, "level.dat");
    const regionDir = path.join(dirPath, "region");

    return fs.existsSync(levelDat) || fs.existsSync(regionDir);
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
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function getWorldLastModified(dirPath) {
    try {
        return fs.statSync(dirPath).mtime.toISOString();
    } catch {
        return null;
    }
}

function getWorldFolders() {
    const entries = fs.readdirSync(SERVER_ROOT, { withFileTypes: true });

    return entries
        .filter(entry => entry.isDirectory())
        .filter(entry => !IGNORED_DIRS.has(entry.name))
        .map(entry => {
            const folderPath = path.join(SERVER_ROOT, entry.name);

            return {
                folder: entry.name,
                path: folderPath
            };
        })
        .filter(world => isMinecraftWorld(world.path));
}

function syncWorlds() {
    console.log("Generando worlds.json");

    const props = readServerProperties();
    const activeFolder = props["level-name"] || "world";

    const previousData = readJsonSafe(OUTPUT_PATH, {
        activeWorld: activeFolder,
        worlds: []
    });

    const previousWorldsMap = new Map();

    if (Array.isArray(previousData.worlds)) {
        for (const world of previousData.worlds) {
            previousWorldsMap.set(world.folder, world);
        }
    }

    const worldFolders = getWorldFolders();

    const worlds = worldFolders.map(worldFolder => {
        const previous = previousWorldsMap.get(worldFolder.folder);

        const sizeBytes = getFolderSize(worldFolder.path);

        return {
            id: previous?.id || worldFolder.folder,
            name: previous?.name || worldFolder.folder,
            folder: worldFolder.folder,
            seed: previous?.seed || "",
            active: worldFolder.folder === activeFolder,
            sizeBytes,
            sizeFormatted: formatBytes(sizeBytes),
            createdAt: previous?.createdAt || null,
            lastModifiedAt: getWorldLastModified(worldFolder.path)
        };
    });

    const output = {
        activeWorld: activeFolder,
        worlds
    };

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8");

    console.log(`Generado: ${OUTPUT_PATH}`);
    console.log(`Mundos exportados: ${worlds.length}`);
    console.log(`Mundo activo: ${activeFolder}`);
}

module.exports = syncWorlds;