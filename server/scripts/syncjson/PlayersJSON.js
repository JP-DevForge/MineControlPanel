const fs = require("fs");
const nbt = require("prismarine-nbt");

const {
  getServerPaths,
  ensureMinecontrolPath
} = require("../serverPaths");

function readJsonSafe(filePath, fallback = []) {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }

    return JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
  } catch {
    return fallback;
  }
}

function mapGamemode(id) {
  switch (id) {
    case 0:
      return "Survival";

    case 1:
      return "Creative";

    case 2:
      return "Adventure";

    case 3:
      return "Spectator";

    default:
      return "Unknown";
  }
}

function mapDimension(dim) {
  switch (dim) {
    case "minecraft:overworld":
      return "world";

    case "minecraft:the_nether":
      return "world_nether";

    case "minecraft:the_end":
      return "world_the_end";

    default:
      return dim || null;
  }
}

function mapOpLevelToRango(level) {
  switch (level) {
    case 4:
      return "Operador";

    default:
      return "Jugador";
  }
}

async function readPlayerDat(filePath) {
  const buffer = fs.readFileSync(filePath);

  const { parsed } = await nbt.parse(buffer);

  return nbt.simplify(parsed);
}

async function syncPlayers(server) {
  const paths = getServerPaths(server);

  ensureMinecontrolPath(server);

  if (!fs.existsSync(paths.playerdata)) {
    fs.writeFileSync(
      paths.playersJson,
      "[]",
      "utf8"
    );

    return [];
  }

  const usercache = readJsonSafe(
    paths.usercache,
    []
  );

  const ops = readJsonSafe(
    paths.ops,
    []
  );

  const usercacheMap = new Map(
    usercache.map(user => [
      user.uuid,
      user.name
    ])
  );

  const opsMap = new Map(
    ops.map(op => [
      op.uuid,
      op
    ])
  );

  const files = fs
    .readdirSync(paths.playerdata)
    .filter(file =>
      file.endsWith(".dat")
    );

  const players = [];

  for (const file of files) {
    const uuid = file.replace(
      ".dat",
      ""
    );

    const filePath = `${paths.playerdata}/${file}`;

    try {
      const data = await readPlayerDat(
        filePath
      );

      const opData = opsMap.get(uuid);

      const opLevel =
        opData?.level ?? 0;

      const pos = Array.isArray(
        data.Pos
      )
        ? data.Pos
        : [null, null, null];

      const deathPos =
        data.LastDeathLocation?.pos ||
        [null, null, null];

      players.push({
        uuid,

        name:
          usercacheMap.get(uuid) ||
          "Unknown",

        online: false,

        gamemode: mapGamemode(
          data.playerGameType
        ),

        rango:
          mapOpLevelToRango(
            opLevel
          ),

        mundo: mapDimension(
          data.Dimension
        ),

        vida:
          typeof data.Health ===
          "number"
            ? data.Health
            : null,

        comida:
          typeof data.foodLevel ===
          "number"
            ? data.foodLevel
            : null,

        coordenadas: {
          x:
            pos[0] !== null
              ? Math.round(pos[0])
              : null,

          y:
            pos[1] !== null
              ? Math.round(pos[1])
              : null,

          z:
            pos[2] !== null
              ? Math.round(pos[2])
              : null
        },

        respawn:
          data.SpawnX !== undefined &&
          data.SpawnY !== undefined &&
          data.SpawnZ !== undefined
            ? {
                mundo:
                  mapDimension(
                    data.SpawnDimension ||
                    "minecraft:overworld"
                  ),

                x: data.SpawnX,
                y: data.SpawnY,
                z: data.SpawnZ
              }
            : null,

        ultimaMuerte:
          data.LastDeathLocation
            ? {
                mundo:
                  mapDimension(
                    data
                      .LastDeathLocation
                      .dimension
                  ),

                x:
                  deathPos[0] ??
                  null,

                y:
                  deathPos[1] ??
                  null,

                z:
                  deathPos[2] ??
                  null,

                causa: null,
                fecha: null
              }
            : null
      });
    } catch (err) {
      console.error(
        `Error leyendo ${file}: ${err.message}`
      );
    }
  }

  fs.writeFileSync(
    paths.playersJson,
    JSON.stringify(
      players,
      null,
      2
    ),
    "utf8"
  );

  console.log(
    `[${server.name}] players.json actualizado`
  );

  return players;
}

function getPlayers(server) {
  const paths = getServerPaths(server);

  return readJsonSafe(
    paths.playersJson,
    []
  );
}

module.exports = {
  syncPlayers,
  getPlayers
};