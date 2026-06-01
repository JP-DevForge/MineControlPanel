const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");
const multer = require("multer");



const backups = require("../scripts/backup");
const serversJSON = require("../scripts/syncjson/ServersJSON");
const syncWorlds = require("../scripts/syncjson/WorldsJSON");
const minecraft = require("../scripts/minecraft");
const minecraftConsole = require("../scripts/minecraftConsole");
const properties = require("../scripts/properties");
const vanillaVersions = require("../scripts/minecraft/VanillaVersions");

const systemInfo =

  require("../scripts/Info/SystemInfo");
const {
  getCachedStatus,
  getAllCachedStatuses
} = require("../scripts/statusMonitor");
const {
  updatePlayersJson
} = require("../scripts/syncjson/PlayersJSON");

const {
  ensureRconConfig
} = require("../scripts/rcon/RconConfig");


const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith(".jar")) {
      return cb(new Error("Solo se permiten archivos .jar"));
    }

    cb(null, true);
  }
});

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
// SERVIDORES GUARDADOS
// =========================

router.get("/api/servers", (req, res) => {
  res.json(serversJSON.getServers());
});
router.get("/api/servers/status", (req, res) => {
  res.json({
    success: true,
    servers: getAllCachedStatuses()
  });
});
router.get("/api/system/info", (req, res) => {
  res.json(systemInfo.getSystemInfo());
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
// VERSIONES VANILLA
// =========================

router.get("/api/vanilla/versions", async (req, res) => {
  try {
    const versions = await vanillaVersions.getVanillaVersions();

    res.json({
      success: true,
      versions
    });
  } catch (error) {
    handleError(res, error, "No se pudieron obtener las versiones de Mojang");
  }
});
// =========================
// CREAR SERVIDOR VANILLA
// =========================

router.post("/api/servers/create/vanilla", async (req, res) => {
  try {
    const {
      name,
      path: serverPath,
      version,
      port
    } = req.body;

    const cleanServerPath = serverPath?.trim();

    if (!name || !cleanServerPath || !version) {
      return res.status(400).json({
        success: false,
        error: "Faltan datos obligatorios"
      });
    }

    if (cleanServerPath === "/") {
      return res.status(400).json({
        success: false,
        error: "No puedes crear un servidor directamente en /"
      });
    }
console.log("[CREAR VANILLA] Validando datos...");

const minecraftPort = Number(port) || 25565;
const rconPort = 25575;

console.log("[CREAR VANILLA] Creando carpeta...");

backups.testBackupPath(cleanServerPath);

console.log("[CREAR VANILLA] Descargando server.jar...");

const jarData =
  await vanillaVersions.downloadVanillaServerJar(
    version,
    cleanServerPath
  );

console.log("[CREAR VANILLA] Creando eula.txt...");

fs.writeFileSync(
  path.join(cleanServerPath, "eula.txt"),
  "eula=true\n"
);

console.log("[CREAR VANILLA] Guardando en serverlist.json...");

const server = serversJSON.addServer({
  type: "local",
  name,
  path: cleanServerPath,
  jar: jarData.jar,
  port: minecraftPort,
  version,
  rcon: {
    enabled: true,
    host: "127.0.0.1",
    port: rconPort,
    password: ""
  }
});

console.log("[CREAR VANILLA] Servidor creado correctamente");  

    res.json({
      success: true,
      message:
        "Servidor Vanilla creado correctamente",
      server
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error:
        error.message ||
        "No se pudo crear el servidor Vanilla"
    });
  }
});
// =========================
// CREAR SERVIDOR CUSTOM
// =========================

router.post(
  "/api/servers/create/custom",
  upload.single("jar"),
  async (req, res) => {
    try {
      const { name, path: serverPath, port } = req.body;
      const jar = req.file;

      const cleanServerPath = serverPath?.trim();

      if (!name || !cleanServerPath || !port) {
        return res.status(400).json({
          success: false,
          error: "Faltan datos obligatorios"
        });
      }

      if (!jar) {
        return res.status(400).json({
          success: false,
          error: "No se ha subido ningún archivo .jar"
        });
      }

      if (cleanServerPath === "/") {
        return res.status(400).json({
          success: false,
          error: "No puedes crear un servidor directamente en /"
        });
      }

      backups.testBackupPath(cleanServerPath);

      const safeJarName = path.basename(jar.originalname);
      const jarPath = path.join(cleanServerPath, safeJarName);

      fs.writeFileSync(jarPath, jar.buffer);

      fs.writeFileSync(
        path.join(cleanServerPath, "eula.txt"),
        "eula=true\n"
      );

      const minecraftPort = Number(port) || 25565;

      const server = serversJSON.addServer({
        type: "local",
        name,
        path: cleanServerPath,
        jar: safeJarName,
        port: minecraftPort,
        version: null,
        rcon: {
          enabled: true,
          host: "127.0.0.1",
          port: 25575,
          password: ""
        }
      });

      return res.json({
        success: true,
        message: "Servidor custom creado correctamente",
        server
      });

    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        error: error.message || "Error creando servidor custom"
      });
    }
  }
);

// =========================
// SERVIDOR UPGRADE
// =========================

router.post("/api/server/:id/version", async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: "Versión no indicada"
      });
    }

    const servers = serversJSON.getServers();
    const server = servers.find(server => server.id === id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const status = getCachedStatus(server.id);

    if (status.status !== "offline" && status.status !== "stopped") {
      return res.status(400).json({
        success: false,
        error: "El servidor debe estar apagado"
      });
    }

    const result = await vanillaVersions.downloadVanillaServerJar(
      version,
      server.path
    );

    server.jar = result.jar;
    server.version = version;

    serversJSON.saveServers(servers);

    res.json({
      success: true,
      version,
      jar: result.jar
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message || "Error cambiando versión"
    });
  }
});
// =========================
// SERVIDOR MINECRAFT
// =========================


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

    const backupConfig = backups.getConfig(updatedServer);

    if (backupConfig.backupOnStart === true) {
      await backups.backup(updatedServer, "start");
    }

    await minecraft.startServer(updatedServer);

    res.json({
      success: true,
      message: "Servidor iniciado",
      server: updatedServer
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message || "No se pudo iniciar el servidor"
    });
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

    const log = minecraftConsole.readConsole(server);

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
        error: "Servidor no encontrado"
      });
    }

    const players = await updatePlayersJson(server);

    res.json(players);
  } catch (error) {
    console.error("Error /players:", error);

    res.status(500).json({
      error: error.message
    });
  }
});
// =========================
// MUNDOS
// =========================
const worldsService = require("../scripts/syncjson/WorldsJSON");

router.get("/api/servers/:id/worlds", (req, res) => {
  try {
    const server = findServer(req.params.id);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const data = worldsService.syncWorlds(server);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    handleError(res, error, "Error obteniendo mundos");
  }
});

router.post("/api/servers/:id/worlds/select", (req, res) => {
  try {
    const server = findServer(req.params.id);
    const { folder } = req.body;

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const status = getCachedStatus(server.id);

    if (status.status !== "offline" && status.status !== "stopped") {
      return res.status(400).json({
        success: false,
        error: "Apaga el servidor antes de cambiar de mundo"
      });
    }

    if (!folder) {
      return res.status(400).json({
        success: false,
        error: "Carpeta de mundo no indicada"
      });
    }

    properties.saveProperty(
      server.path,
      "level-name",
      folder
    );

    const data = worldsService.syncWorlds(server);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    handleError(res, error, "Error seleccionando mundo");
  }
});
router.post("/api/servers/:id/worlds/create", (req, res) => {
  try {
    const server = findServer(req.params.id);
    const { name } = req.body;

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Nombre de mundo no indicado"
      });
    }

    const safeName = name
      .trim()
      .replace(/[<>:"/\\|?*]/g, "")
      .replace(/\s+/g, "_");

    if (!safeName) {
      return res.status(400).json({
        success: false,
        error: "Nombre de mundo no válido"
      });
    }

    const worldPath = path.join(server.path, safeName);

    if (fs.existsSync(worldPath)) {
      return res.status(400).json({
        success: false,
        error: "Ya existe un mundo con ese nombre"
      });
    }

    fs.mkdirSync(worldPath, { recursive: true });

    const data = worldsService.syncWorlds(server);

    res.json({
      success: true,
      folder: safeName,
      data
    });

  } catch (error) {
    handleError(res, error, "Error creando mundo");
  }
});
router.post("/api/servers/:id/worlds/delete", (req, res) => {
  try {
    const server = findServer(req.params.id);
    const { folder } = req.body;

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    if (!folder) {
      return res.status(400).json({
        success: false,
        error: "Mundo no indicado"
      });
    }

    const worldPath = path.join(
      server.path,
      folder
    );

    if (!fs.existsSync(worldPath)) {
      return res.status(404).json({
        success: false,
        error: "El mundo no existe"
      });
    }

    const activeWorld =
      properties.readProperties(server.path)["level-name"];

    if (activeWorld === folder) {
      return res.status(400).json({
        success: false,
        error: "No puedes borrar el mundo activo"
      });
    }

    fs.rmSync(worldPath, {
      recursive: true,
      force: true
    });

    const data =
      worldsService.syncWorlds(server);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    handleError(
      res,
      error,
      "Error borrando mundo"
    );
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
router.post("/api/server/properties", (req, res) => {
  try {
    const { server } = req.body;

    if (!server || !server.path) {
      return res.status(400).json({
        success: false,
        error: "Servidor no válido"
      });
    }

    const data = properties.readProperties(server.path);

    res.json({
      success: true,
      properties: data
    });
  } catch (error) {
    handleError(res, error, "Error leyendo server.properties");
  }
});

router.post("/api/server/properties/save", (req, res) => {
  try {
    const { server, properties: newProperties } = req.body;

    if (!server || !server.path) {
      return res.status(400).json({
        success: false,
        error: "Servidor no válido"
      });
    }

    properties.saveProperties(server.path, newProperties);

    res.json({
      success: true
    });
  } catch (error) {
    handleError(res, error, "Error guardando server.properties");
  }
});
// =========================
// BACKUPS
// =========================

router.post("/api/server/backups", (req, res) => {
  try {
    const { serverId } = req.body;

    const server = serversJSON
      .getServers()
      .find(s => s.id === serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const backupsList =
      backups.listBackups(server);

    res.json({
      success: true,
      backups: backupsList
    });

  } catch (error) {
    handleError(
      res,
      error,
      "Error obteniendo backups"
    );
  }
});

router.post("/api/server/backups/create", async (req, res) => {
  try {
    const {
      serverId,
      reason
    } = req.body;

    const server = serversJSON
      .getServers()
      .find(s => s.id === serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const backup = await backups.backup(
      server,
      reason || "manual"
    );

    res.json({
      success: true,
      backup
    });

  } catch (error) {
    handleError(
      res,
      error,
      "Error creando backup"
    );
  }
});

router.post("/api/server/backups/restore", async (req, res) => {
  try {
    const {
      serverId,
      backupId
    } = req.body;

    const server = serversJSON
      .getServers()
      .find(s => s.id === serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    await backups.restoreBackup(
      server,
      backupId
    );

    res.json({
      success: true
    });

  } catch (error) {
    handleError(
      res,
      error,
      "Error restaurando backup"
    );
  }
});

router.post("/api/server/backups/delete", (req, res) => {
  try {
    const {
      serverId,
      backupId
    } = req.body;

    const server = serversJSON
      .getServers()
      .find(s => s.id === serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    backups.deleteBackup(
      server,
      backupId
    );

    res.json({
      success: true
    });

  } catch (error) {
    handleError(
      res,
      error,
      "Error eliminando backup"
    );
  }
});
router.post("/api/server/backups/config", (req, res) => {
  try {
    const { serverId } = req.body;

    const server = findServer(serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    const config = backups.getConfig(server);

    res.json({
      success: true,
      config
    });

  } catch (error) {
    handleError(
      res,
      error,
      "Error obteniendo configuración de backups"
    );
  }
});
router.post("/api/server/backups/config/save", (req, res) => {
  try {
    const {
      serverId,
      backupPath,
      backupOnStart,
      automaticBackups,
      automaticIntervalMinutes,
      maxAutomaticBackups
    } = req.body;

    const server = findServer(serverId);

    if (!server) {
      return res.status(404).json({
        success: false,
        error: "Servidor no encontrado"
      });
    }

    backups.testBackupPath(backupPath);

    const config = backups.saveConfig(server, {
      backupPath,
      backupOnStart,
      automaticBackups,
      automaticIntervalMinutes,
      maxAutomaticBackups
    });

    res.json({
      success: true,
      config
    });

} catch (error) {
  console.error(error);

  res.status(400).json({
    success: false,
    error: "La ruta no es válida o no tiene permisos de escritura"
  });
}
});
router.post("/api/server/backups/test-path", (req, res) => {
  try {
    const { backupPath } = req.body;

    backups.testBackupPath(backupPath);

    res.json({
      success: true
    });

} catch (error) {
  console.error(error);

  res.status(400).json({
    success: false,
    error: "El path no es válida o no tiene permisos de escritura"
  });
}
});

router.get("/api/server/status/:id", (req, res) => {
  
  res.json({
    success: true,
    ...getCachedStatus(req.params.id)
  });
});

module.exports = router;