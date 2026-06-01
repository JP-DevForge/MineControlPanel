const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const net = require("net");
const { Rcon } = require("rcon-client");

const websocket = require("../websocket");
const minecraftConsole = require("./minecraftConsole");

const rconConnections = new Map();

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

async function checkRconConnection(server) {
  await getRconConnection(server);

  return true;
}

async function sendCommand(server, command) {
  if (!command || !command.trim()) {
    throw new Error("Comando vacío");
  }

  const connection = await getRconConnection(server);

  const cleanCommand = command.trim();

  minecraftConsole.appendPanelConsole(
    server,
    `[MCP >] ${cleanCommand}`
  );

  const response = await connection.send(cleanCommand);

  if (response) {
    minecraftConsole.appendPanelConsole(
      server,
      `[MCP <] ${response}`
    );
  }

  minecraftConsole.saveCommandHistory(
    server,
    cleanCommand
  );

  return response;
}

async function sendSilentCommand(server, command) {
  if (!command || !command.trim()) {
    throw new Error("Comando vacío");
  }

  const connection = await getRconConnection(server);

  return connection.send(command.trim());
}

async function startServer(server) {
  if (!server || !server.path || !server.jar) {
    throw new Error("Faltan path o jar del servidor");
  }

  const port = Number(server.port) || 25565;

  if (await isPortOpen(port)) {
    throw new Error("Ya hay un servidor iniciado en este puerto");
  }

  const jarPath = path.join(server.path, server.jar);

  if (!fs.existsSync(jarPath)) {
    throw new Error(`No existe el jar: ${jarPath}`);
  }

  minecraftConsole.clearPanelConsole(server);

  const child = spawn(
    "java",
    ["-jar", server.jar, "nogui"],
    {
      cwd: server.path,
      detached: true,
      stdio: "ignore",
      windowsHide: true
    }
  );

  child.unref();

  websocket.broadcastConsole(
    `Servidor iniciado de forma independiente: ${server.name}\n`
  );

  return true;
}

module.exports = {
  startServer,
  sendCommand,
  sendSilentCommand,
  checkRconConnection
};