const serversJSON = require("./syncjson/ServersJSON");
const minecraftConsole = require("./minecraftConsole");
const { pingMinecraftServer } = require("./ping");

const statusCache = new Map();
const failedPingCount = new Map();
const identifiedPortServer = new Map();

let monitorInterval = null;

function getServerPort(server) {
  return Number(server.port || 25565);
}

function getServersWithSamePort(server, servers) {
  const port = getServerPort(server);

  return servers.filter(item => getServerPort(item) === port);
}

async function identifyServerByRcon(port, samePortServers) {
  const alreadyIdentified = identifiedPortServer.get(port);

  if (alreadyIdentified) {
    return alreadyIdentified;
  }

  for (const server of samePortServers) {
    try {
      await minecraftConsole.checkConnection(server);

      identifiedPortServer.set(port, server.id);



      return server.id;
    } catch {
      // Este servidor no es el que está activo en ese puerto.
    }
  }

  identifiedPortServer.delete(port);

  return null;
}

async function detectServerStatus(server, servers) {
  const host = "127.0.0.1";
  const port = getServerPort(server);
  const samePortServers = getServersWithSamePort(server, servers);

  let pingData = null;

  try {
    const ping = await pingMinecraftServer(host, port);

    if (ping.online) {
      pingData = ping;
      failedPingCount.set(server.id, 0);
    }
  } catch {
    // Ignorar. Se trata abajo.
  }

  if (!pingData) {
    const failures = (failedPingCount.get(server.id) || 0) + 1;
    failedPingCount.set(server.id, failures);

    identifiedPortServer.delete(port);

    if (failures < 3) {
      return {
        status: "unknown",
        online: false,
        players: { online: null, max: null },
        version: null,
        latency: null,
        reason: "waiting_ping_retry"
      };
    }

    return {
      status: "offline",
      online: false,
      players: { online: null, max: null },
      version: null,
      latency: null,
      reason: "ping_failed"
    };
  }

  if (samePortServers.length === 1) {
    return {
      status: "online",
      online: true,
      players: pingData.players || { online: null, max: null },
      version: pingData.version || null,
      latency: pingData.latency || null,
      reason: null
    };
  }

  const identifiedServerId =
    await identifyServerByRcon(port, samePortServers);

  if (identifiedServerId === server.id) {
    return {
      status: "online",
      online: true,
      players: pingData.players || { online: null, max: null },
      version: pingData.version || null,
      latency: pingData.latency || null,
      reason: "identified_by_rcon"
    };
  }

  return {
    status: "offline",
    online: false,
    players: { online: null, max: null },
    version: null,
    latency: null,
    reason: identifiedServerId
      ? "same_port_other_server_online"
      : "same_port_not_identified"
  };
}

async function monitorOnce() {
  const servers = serversJSON.getServers();

  for (const server of servers) {
    const current = await detectServerStatus(server, servers);

    statusCache.set(server.id, {
      serverId: server.id,
      name: server.name,
      status: current.status,
      online: current.online,
      players: current.players,
      version: current.version,
      latency: current.latency,
      reason: current.reason,
      updatedAt: Date.now()
    });


  }
}

function startStatusMonitor() {
  if (monitorInterval) return;

  monitorOnce();

  monitorInterval = setInterval(monitorOnce, 500);
}

function getCachedStatus(serverId) {
  return statusCache.get(serverId) || {
    serverId,
    status: "unknown",
    online: false,
    players: { online: null, max: null },
    version: null,
    latency: null,
    reason: "not_checked_yet",
    updatedAt: null
  };
}

function getAllCachedStatuses() {
  return Array.from(statusCache.values());
}

module.exports = {
  startStatusMonitor,
  monitorOnce,
  getCachedStatus,
  getAllCachedStatuses
};