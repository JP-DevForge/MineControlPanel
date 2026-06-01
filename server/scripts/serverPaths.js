const fs = require("fs");
const path = require("path");

function getWorldName(root) {
  const propertiesPath = path.join(
    root,
    "server.properties"
  );

  if (!fs.existsSync(propertiesPath)) {
    return "world";
  }

  try {
    const content = fs.readFileSync(
      propertiesPath,
      "utf8"
    );

    const line = content
      .split(/\r?\n/)
      .find(line =>
        line.startsWith("level-name=")
      );

    if (!line) {
      return "world";
    }

    const worldName = line
      .replace("level-name=", "")
      .trim();

    return worldName || "world";
  } catch {
    return "world";
  }
}

function getSafeFileName(name) {
  return String(name || "world")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

function getServerPaths(server) {
  const root = server.path;

  const worldName = getWorldName(root);
  const safeWorldName = getSafeFileName(worldName);

  return {
    root,
    worldName,

    playerdata: path.join(
      root,
      worldName,
      "playerdata"
    ),

    usercache: path.join(
      root,
      "usercache.json"
    ),

    ops: path.join(
      root,
      "ops.json"
    ),

    minecontrol: path.join(
      root,
      "minecontrol-data"
    ),

    playersDir: path.join(
      root,
      "minecontrol-data",
      "players"
    ),

    playersJson: path.join(
      root,
      "minecontrol-data",
      "players",
      `players-${safeWorldName}.json`
    ),

    worldsJson: path.join(
      root,
      "minecontrol-data",
      "worlds.json"
    ),

    consoleHistory: path.join(
      root,
      "minecontrol-data",
      "console-hystory.txt"
    )
  };
}

function ensureMinecontrolPath(server) {
  const paths = getServerPaths(server);

  if (!fs.existsSync(paths.minecontrol)) {
    fs.mkdirSync(paths.minecontrol, {
      recursive: true
    });
  }

  if (!fs.existsSync(paths.playersDir)) {
    fs.mkdirSync(paths.playersDir, {
      recursive: true
    });
  }

  return paths.minecontrol;
}

module.exports = {
  getServerPaths,
  ensureMinecontrolPath
};