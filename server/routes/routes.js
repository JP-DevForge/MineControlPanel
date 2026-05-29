const express = require("express");
const os = require("os");

const serversJSON = require("../scripts/syncjson/ServersJSON");
const syncWorlds = require("../scripts/syncjson/WorldsJSON");

const minecraft = require("../scripts/minecraft");

const router = express.Router();
const {
  syncPlayers,
  getPlayers
} = require("../scripts/syncjson/PlayersJSON");
const {
  ensureRconConfig
} = require("../scripts/rcon/RconConfig");
function handleError(res, error, message) {
  console.error(error);

  res.status(500).json({
    success: false,
    error: message
  });
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
  const server = serversJSON
    .getServers()
    .find(item => item.id === req.params.id);

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

    const updatedServer = ensureRconConfig(server);

    serversJSON.updateServer(server.id, {
      rcon: updatedServer.rcon
    });

    await minecraft.startServer(updatedServer);

    res.json({
      success: true,
      message: "Servidor iniciado"
    });

  } catch (error) {
    handleError(res, error, "No se pudo iniciar el servidor");
  }
});


// =========================
// COMANDOS
// =========================

router.post("/api/server/command", (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({
      success: false,
      error: "Comando requerido"
    });
  }

  try {
    minecraft.sendCommand(command);

    res.json({
      success: true
    });

  } catch (error) {
    handleError(res, error, "No se pudo enviar el comando");
  }
});

// =========================
// PLAYERS
// =========================
router.get("/api/servers/:id/players", async (req, res) => {
  try {
    const server = serversJSON
      .getServers()
      .find(s => s.id === req.params.id);

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
router.post("/api/servers/:id/rcon/ensure", (req, res) => {
  try {
    const server = serversJSON
      .getServers()
      .find(server => server.id === req.params.id);

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