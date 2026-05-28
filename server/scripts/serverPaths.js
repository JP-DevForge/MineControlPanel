const fs = require("fs");
const path = require("path");

function getServerPaths(server) {
  const root = server.path;

  return {
    root,

    playerdata: path.join(
      root,
      "world",
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

    playersJson: path.join(
      root,
      "minecontrol-data",
      "players.json"
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

  return paths.minecontrol;
}

module.exports = {
  getServerPaths,
  ensureMinecontrolPath
};