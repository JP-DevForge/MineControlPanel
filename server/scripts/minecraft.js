const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const websocket = require("../websocket");

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

  const child = spawn(
    "java",
    [
      "-jar",
      server.jar,
      "nogui"
    ],
    {
      cwd: server.path,
      detached: true,
      stdio: "ignore",
      windowsHide: true
    }
  );

  child.unref();

  currentServer = server;
  mcRunning = true;

  websocket.broadcastConsole(
    `Servidor iniciado de forma independiente: ${server.name}\n`
  );

  return true;
}

function stopServer() {
  throw new Error(
    "El servidor independiente debe detenerse por RCON con el comando stop"
  );
}

function restartServer(server) {
  throw new Error(
    "El reinicio independiente debe hacerse con RCON stop y luego startServer"
  );
}

function sendCommand() {
  throw new Error(
    "Los comandos deben enviarse por RCON cuando el servidor es independiente"
  );
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
  isRunning,
  getCurrentServer
};