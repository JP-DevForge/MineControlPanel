const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Rcon } = require("rcon-client");

const websocket = require("../websocket");

const rconConnections = new Map();

let currentServer = null;
let mcRunning = false;

function getLatestLogPath(server) {
  return path.join(server.path, "logs", "latest.log");
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
  const dir = path.join(server.path, "minecontrol-data");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
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

function appendPanelConsole(server, text) {
  ensureMinecontrolData(server);

  const now = new Date();

  const time =
    now.toTimeString().split(" ")[0];

  const line = `[${time}] [MineControlPanel/RCON]: ${text}\n`;

  fs.appendFileSync(
    getPanelConsolePath(server),
    line,
    "utf8"
  );
}

function parseMinecraftLogDate(line) {
  const match = line.match(/^\[(\d{2}):(\d{2}):(\d{2})\]/);

  if (!match) {
    return null;
  }

  const date = new Date();

  date.setHours(
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    0
  );

  return date.getTime();
}

function parsePanelLogDate(line) {
  return parseMinecraftLogDate(line);
}

function normalizeConsoleLine(line) {
  const panelTime = parsePanelLogDate(line);

  if (panelTime !== null) {
    return {
      time: panelTime,
      line
    };
  }

  const minecraftTime = parseMinecraftLogDate(line);

  return {
    time: minecraftTime ?? 0,
    line
  };
}

function readConsole(server) {
  const latestLogPath = getLatestLogPath(server);
  const panelConsolePath = getPanelConsolePath(server);

  const latestLines = readLastLines(latestLogPath, 300);
  const panelLines = readLastLines(panelConsolePath, 150);

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

function saveCommandHistory(server, command) {
  ensureMinecontrolData(server);

  fs.appendFileSync(
    getConsoleHistoryPath(server),
    `[${new Date().toISOString()}] ${command}\n`,
    "utf8"
  );
}

async function getRconConnection(server) {
  if (!server?.rcon?.enabled) {
    throw new Error("RCON no está configurado para este servidor");
  }

  const existingConnection = rconConnections.get(server.id);

  if (existingConnection) {
    return existingConnection;
  }

  const connection = await Rcon.connect({
    host: server.rcon.host || "127.0.0.1",
    port: Number(server.rcon.port),
    password: server.rcon.password
  });

  rconConnections.set(server.id, connection);

  connection.on("end", () => {
    rconConnections.delete(server.id);
  });

  connection.on("error", () => {
    rconConnections.delete(server.id);
  });

  return connection;
}

async function sendCommand(server, command) {
  const connection = await getRconConnection(server);

  appendPanelConsole(server, `[MCP >] ${command}`);

  const response = await connection.send(command);

  if (response) {
    appendPanelConsole(server, `[MCP <] ${response}`);
  }

  saveCommandHistory(server, command);

  return response;
}

function startServer(server) {
  if (mcRunning) {
    throw new Error("El servidor ya está iniciado");
  }

  if (!server || !server.path || !server.jar) {
    throw new Error("Faltan path o jar del servidor");
  }

  const jarPath = path.join(server.path, server.jar);

  if (!fs.existsSync(jarPath)) {
    throw new Error(`No existe el jar: ${jarPath}`);
  }

  const child = spawn("java", ["-jar", server.jar, "nogui"], {
    cwd: server.path,
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });

  child.unref();

  currentServer = server;
  mcRunning = true;

  websocket.broadcastConsole(
    `Servidor iniciado de forma independiente: ${server.name}\n`
  );

  return true;
}

function stopServer() {
  throw new Error("Usa el comando RCON stop");
}

function restartServer() {
  throw new Error("Usa stop por RCON y luego vuelve a iniciar el servidor");
}

function isRunning() {
  return mcRunning;
}

function getCurrentServer() {
  return currentServer;
}

module.exports = {
  startServer,
  stopServer,
  restartServer,
  sendCommand,
  readConsole,
  isRunning,
  getCurrentServer
};