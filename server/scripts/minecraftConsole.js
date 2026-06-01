const fs = require("fs");
const path = require("path");

function getLatestLogPath(server) {
  return path.join(
    server.path,
    "logs",
    "latest.log"
  );
}

function getConsoleHistoryPath(server) {
  return path.join(
    server.path,
    "minecontrol-data",
    "console-history.txt"
  );
}

function getPanelConsolePath(server) {
  return path.join(
    server.path,
    "minecontrol-data",
    "panel-console.log"
  );
}

function ensureMinecontrolData(server) {
  const dir = path.join(
    server.path,
    "minecontrol-data"
  );

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true
    });
  }
}

function readLastLines(filePath, maxLines) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-maxLines);
}

function parseMinecraftLogDate(line) {
  const match = line.match(
    /^\[(\d{2}):(\d{2}):(\d{2})\]/
  );

  if (!match) {
    return null;
  }

  const now = new Date();

  const lineDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    Number(match[1]),
    Number(match[2]),
    Number(match[3])
  );

  if (
    lineDate.getTime() >
    now.getTime() + 60000
  ) {
    lineDate.setDate(
      lineDate.getDate() - 1
    );
  }

  return lineDate.getTime();
}

function normalizeConsoleLine(line) {
  return {
    time:
      parseMinecraftLogDate(line) ?? 0,
    line
  };
}

function readConsole(server) {
  const latestLines = readLastLines(
    getLatestLogPath(server),
    300
  );

  const panelLines = readLastLines(
    getPanelConsolePath(server),
    150
  );

  return [
    ...latestLines,
    ...panelLines
  ]
    .map(normalizeConsoleLine)
    .sort((a, b) => a.time - b.time)
    .slice(-350)
    .map(item => item.line)
    .join("\n");
}

function appendPanelConsole(
  server,
  text
) {
  ensureMinecontrolData(server);

  const time =
    new Date()
      .toTimeString()
      .split(" ")[0];

  fs.appendFileSync(
    getPanelConsolePath(server),
    `[${time}] [MineControlPanel] ${text}\n`,
    "utf8"
  );
}

function saveCommandHistory(
  server,
  command
) {
  ensureMinecontrolData(server);

  fs.appendFileSync(
    getConsoleHistoryPath(server),
    `[${new Date().toISOString()}] ${command}\n`,
    "utf8"
  );
}

function clearPanelConsole(server) {
  ensureMinecontrolData(server);

  fs.writeFileSync(
    getPanelConsolePath(server),
    "",
    "utf8"
  );
}

module.exports = {
  readConsole,
  appendPanelConsole,
  saveCommandHistory,
  clearPanelConsole
};