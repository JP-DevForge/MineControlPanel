const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const websocket = require("../websocket");
const minecraftConsole = require("./minecraftConsole");

let currentServer = null;
let mcRunning = false;

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

async function sendCommand(server, command) {
  return minecraftConsole.sendCommand(server, command);
}

function isRunning() {
  return mcRunning;
}

function getCurrentServer() {
  return currentServer;
}

module.exports = {
  startServer,
  sendCommand,
  isRunning,
  getCurrentServer
};