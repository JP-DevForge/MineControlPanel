const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");

const websocket = require("../websocket");
const minecraftConsole = require("./minecraftConsole");

function isPortOpen(port, host = "127.0.0.1") {
  return new Promise(resolve => {
    const socket = new net.Socket();

    socket.setTimeout(500);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function startServer(server) {
  if (!server || !server.path || !server.jar) {
    throw new Error("Faltan path o jar del servidor");
  }

  const port = Number(server.port) || 25565;

  if (await isPortOpen(port)) {
    throw new Error("El servidor ya está iniciado");
  }

  const jarPath = path.join(server.path, server.jar);

  if (!fs.existsSync(jarPath)) {
    throw new Error(`No existe el jar: ${jarPath}`);
  }
minecraftConsole.clearPanelConsole(server);
  const child = spawn("java", ["-jar", server.jar, "nogui"], {
    cwd: server.path,
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });

  child.unref();

  websocket.broadcastConsole(
    `Servidor iniciado de forma independiente: ${server.name}\n`
  );

  return true;
}

async function sendCommand(server, command) {
  return minecraftConsole.sendCommand(server, command);
}

module.exports = {
  startServer,
  sendCommand
};