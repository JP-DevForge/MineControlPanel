const fs = require("fs");
const nbt = require("prismarine-nbt");
const path = require("path");
const minecraft = require("../minecraft");

const {
  getServerPaths,
  ensureMinecontrolPath
} = require("../serverPaths");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    return JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
  } catch {
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

async function readPlayerDat(filePath) {
  const buffer = fs.readFileSync(filePath);
  const { parsed } = await nbt.parse(buffer);

  return nbt.simplify(parsed);
}

function parseList(text) {
  if (!text || !text.includes(":")) {
    return [];
  }

  return text
    .split(":")
    .slice(1)
    .join(":")
    .split(",")
    .map(name => name.trim())
    .filter(Boolean);
}

function parseNumber(text) {
  const match = String(text).match(
    /-?\d+(\.\d+)?/
  );

  return match ? Number(match[0]) : null;
}

function parseCoords(text) {
  const numbers = String(text).match(
    /-?\d+(\.\d+)?/g
  );

  if (!numbers || numbers.length < 3) {
    return null;
  }

  return {
    x: Math.round(Number(numbers[0])),
    y: Math.round(Number(numbers[1])),
    z: Math.round(Number(numbers[2]))
  };
}

function mapCoords(pos) {
  if (!Array.isArray(pos) || pos.length < 3) {
    return null;
  }

  return {
    x: Math.round(pos[0]),
    y: Math.round(pos[1]),
    z: Math.round(pos[2])
  };
}

function parseDimension(text) {
  const match = String(text).match(
    /minecraft:[a-z_]+/
  );

  return match ? match[0] : null;
}

function mapDimension(dimension) {
  switch (dimension) {
    case "minecraft:overworld":
      return "world";

    case "minecraft:the_nether":
      return "world_nether";

    case "minecraft:the_end":
      return "world_the_end";

    default:
      return dimension || null;
  }
}

function mapGamemode(id) {
  switch (Number(id)) {
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

async function getOnlineNames(server) {
  const response = await minecraft.sendSilentCommand(
    server,
    "list"
  );

  return parseList(response);
}

async function getLivePlayerData(server, name) {
  const [
    health,
    food,
    pos,
    dimension,
    gamemode
  ] = await Promise.all([
    minecraft.sendSilentCommand(
      server,
      `data get entity ${name} Health`
    ),

    minecraft.sendSilentCommand(
      server,
      `data get entity ${name} foodLevel`
    ),

    minecraft.sendSilentCommand(
      server,
      `data get entity ${name} Pos`
    ),

    minecraft.sendSilentCommand(
      server,
      `data get entity ${name} Dimension`
    ),

    minecraft.sendSilentCommand(
      server,
      `data get entity ${name} playerGameType`
    )
  ]);

  return {
    online: true,
    vida: parseNumber(health),
    comida: parseNumber(food),
    coordenadas: parseCoords(pos),
    mundo: mapDimension(parseDimension(dimension)),
    gamemode: mapGamemode(parseNumber(gamemode))
  };
}

function getDatPlayerData(data) {
  return {
    vida:
      typeof data.Health === "number"
        ? data.Health
        : null,

    comida:
      typeof data.foodLevel === "number"
        ? data.foodLevel
        : null,

    coordenadas: mapCoords(data.Pos),

    mundo: mapDimension(data.Dimension),

    gamemode: mapGamemode(data.playerGameType)
  };
}
function getPlayerRango(ops, uuid) {
  const op = ops.find(item => item.uuid === uuid);

  if (!op) {
    return "Jugador";
  }

  return "Operador";
}
async function updatePlayersJson(server) {
  const paths = getServerPaths(server);
const whitelist = readJson(
  path.join(paths.root, "whitelist.json")
);

const bannedPlayers = readJson(
  path.join(paths.root, "banned-players.json")
);
  ensureMinecontrolPath(server);

  const players = [];

  if (!fs.existsSync(paths.playerdata)) {
    writeJson(paths.playersJson, players);
    return players;
  }

  const usercache = readJson(paths.usercache);
  const ops = readJson(paths.ops);
  const onlineNames = await getOnlineNames(server)
    .catch(() => []);

  const files = fs
    .readdirSync(paths.playerdata)
    .filter(file => file.endsWith(".dat"));

  for (const file of files) {
    const uuid = file.replace(".dat", "");

    const user = usercache.find(
      item => item.uuid === uuid
    );

    const name = user?.name || "Unknown";
    const online = onlineNames.includes(name);
    const isBanned = bannedPlayers.some(
      item => item.uuid === uuid || item.name === name
    );

    const isWhitelisted = whitelist.some(
      item => item.uuid === uuid || item.name === name
    );
    let player = {
      uuid,
      name,
      online,
      rango: isBanned
        ? "Baneado"
        : getPlayerRango(ops, uuid),

      banned: isBanned,
      whitelisted: isWhitelisted,
      vida: null,
      comida: null,
      mundo: null,
      gamemode: null,
      coordenadas: null
    };

    if (online) {
      try {
        player = {
          ...player,
          ...(await getLivePlayerData(server, name))
        };
      } catch {
        player.online = true;
      }
    } else {
      try {
        const data = await readPlayerDat(
          `${paths.playerdata}/${file}`
        );

        player = {
          ...player,
          ...getDatPlayerData(data)
        };
      } catch {
        // Si falla el .dat, deja los datos en null.
      }
    }

    players.push(player);
  }

  writeJson(paths.playersJson, players);

  return players;
}

module.exports = {
  updatePlayersJson
};