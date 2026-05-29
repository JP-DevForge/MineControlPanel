const express = require("express");
const os = require("os");

const serversJSON = require("../scripts/syncjson/ServersJSON");
const syncWorlds = require("../scripts/syncjson/WorldsJSON");
const minecraft = require("../scripts/minecraft");

const {
  syncPlayers
} = require("../scripts/syncjson/PlayersJSON");

const {
  ensureRconConfig
} = require("../scripts/rcon/RconConfig");

const router = express.Router();

function handleError(res, error, message) {
  console.error(error);

  res.status(500).json({
    success: false,
    error: message
  });
}

function findServer(id) {
  return serversJSON
    .getServers()
    .find(server => server.id === id);
}

// =========================
// TEST
// =========================

router.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "MineControlPanel API funcionando"
  });
});

// =========================
// SISTEMA
// =========================

router.get("/api/system", (req, res) => {
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpuCount: os.cpus().length
  });
});

// =========================
// SERVIDORES GUARDADOS
// =========================

router.get("/api/servers", (req, res) => {
  res.json(serversJSON.getServers());
});

router.get("/api/servers/:id", (req, res) => {
  const server = findServer(req.params.id);

  if (!server) {
    return res.status(404).json({
      success: false,
      error: "Servidor no encontrado"
    });
  }

  res.json(server);
});

router.post("/api/servers", (req, res) => {
  const server = serversJSON.addServer(req.body);

  res.json({
    success: true,
    server
  });
});

router.delete("/api/servers/:id", (req, res) => {
  serversJSON.removeServer(req.params.id);

  res.json({
    success: true
  });
});

// =========================
// SERVIDOR MINECRAFT
// =========================

router.get("/api/server/status", (req, res) => {
  res.json({
    success: true,
    running: minecraft.isRunning()
  });
});

router.post("/api/server/start", async (req, res) => {
  try {
    const { server } = req.body;

    if (!server || !server.id) {
      return res.status(400).json({
        success: false,
        error: "Servidor requerido"
      });
    }

    const savedServer = findServer(server.id);

    if (!savedServer) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const updatedServer = ensureRconConfig(savedServer);

    serversJSON.updateServer(savedServer.id, {
      rcon: updatedServer.rcon
    });

    await minecraft.startServer(updatedServer);

    res.json({
      success: true,
      message: "Servidor iniciado",
      server: updatedServer
    });

  } catch (error) {
    handleError(res, error, "No se pudo iniciar el servidor");
  }
});

// =========================
// CONSOLA
// =========================

router.get("/api/server/console", (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "ID de servidor requerido"
      });
    }

    const server = findServer(id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const log = minecraft.readConsole(server);

    res.json({
      success: true,
      log
    });

  } catch (error) {
    handleError(res, error, "No se pudo leer latest.log");
  }
});

router.post("/api/server/command", async (req, res) => {
  try {
    const { id, command } = req.body;

    if (!id || !command) {
      return res.status(400).json({
        success: false,
        error: "Faltan id o command"
      });
    }

    const server = findServer(id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const response = await minecraft.sendCommand(server, command);

    res.json({
      success: true,
      response
    });

  } catch (error) {
    handleError(res, error, "No se pudo enviar el comando por RCON");
  }
});

// =========================
// PLAYERS
// =========================

router.get("/api/servers/:id/players", async (req, res) => {
  try {
    const server = findServer(req.params.id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const players = await syncPlayers(server);

    res.json(players);

  } catch (error) {
    handleError(
      res,
      error,
      "No se pudieron obtener los jugadores"
    );
  }
});

// =========================
// MUNDOS
// =========================

router.get("/api/worlds", async (req, res) => {
  try {
    const worlds = await syncWorlds();

    res.json(worlds);

  } catch (error) {
    handleError(res, error, "No se pudieron obtener los mundos");
  }
});

// =========================
// RCON
// =========================

router.post("/api/servers/:id/rcon/ensure", (req, res) => {
  try {
    const server = findServer(req.params.id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const updatedServer = ensureRconConfig(server);

    serversJSON.updateServer(server.id, {
      rcon: updatedServer.rcon
    });

    res.json({
      success: true,
      server: updatedServer
    });

  } catch (error) {
    handleError(res, error, "No se pudo configurar RCON");
  }
});

module.exports = router;