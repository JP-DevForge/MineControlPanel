const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SERVERS_FILE = path.join(
  __dirname,
  "../../../config/serverlist.json"
);

function ensureServersFile() {
  const dir = path.dirname(SERVERS_FILE);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(SERVERS_FILE)) {
    fs.writeFileSync(SERVERS_FILE, "[]");
  }
}

function getServers() {
  ensureServersFile();

  try {
    const data = fs.readFileSync(SERVERS_FILE, "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveServers(servers) {
  ensureServersFile();

  fs.writeFileSync(
    SERVERS_FILE,
    JSON.stringify(servers, null, 2)
  );
}

function addServer(data) {
  const servers = getServers();

  const serverPath = data.path;
  const jarName = data.jar;

  if (!serverPath || !jarName) {
    throw new Error("Faltan la ruta del servidor o el archivo .jar");
  }

  const jarPath = path.join(serverPath, jarName);

  if (!fs.existsSync(jarPath)) {
    throw new Error(`El archivo jar no existe: ${jarPath}`);
  }

  if (!fs.statSync(jarPath).isFile()) {
    throw new Error(`La ruta no es un archivo jar válido: ${jarPath}`);
  }

  const server = {
    id: crypto.randomUUID(),
    type: data.type || "local",
    name: data.name,
    path: data.path,
    jar: data.jar,
    port: data.port || 25565,
    version: data.version || null,
    rcon: data.rcon || {
      enabled: true,
      host: "127.0.0.1",
      port: 25575,
      password: ""
    },
    createdAt: new Date().toISOString()
  };

  servers.push(server);
  saveServers(servers);

  return server;
}
function removeServer(id) {
  const servers = getServers().filter(
    server => server.id !== id
  );

  saveServers(servers);
}

function updateServer(id, data) {
  const servers = getServers();

  const index = servers.findIndex(
    server => server.id === id
  );

  if (index === -1) {
    return null;
  }

  servers[index] = {
    ...servers[index],
    ...data
  };

  saveServers(servers);

  return servers[index];
}

module.exports = {
  getServers,
  saveServers,
  addServer,
  removeServer,
  updateServer
};