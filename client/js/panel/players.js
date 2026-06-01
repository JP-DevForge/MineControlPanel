let players = [];
let filter = "";
let refreshTimer = null;
let eventsBound = false;

const REFRESH_INTERVAL = 1000;

function getCurrentServerId() {
  const params = new URLSearchParams(window.location.search);

  const queryId =
    params.get("id") ||
    params.get("server") ||
    params.get("serverId") ||
    params.get("uuid");

  if (queryId) {
    return queryId;
  }

  const match = window.location.pathname.match(
    /\/servers\/([^/]+)|\/server\/([^/]+)|\/panel\/([^/]+)/
  );

  if (match) {
    return match[1] || match[2] || match[3];
  }

  const raw =
    sessionStorage.getItem("mcp_active_server") ||
    localStorage.getItem("mcp_active_server") ||
    sessionStorage.getItem("activeServer") ||
    localStorage.getItem("activeServer");

  if (!raw) {
    return null;
  }

  try {
    const server = JSON.parse(raw);

    return (
      server.id ||
      server.uuid ||
      server.serverId ||
      null
    );
  } catch {
    return null;
  }
}

function safe(value) {
  return value ?? "-";
}

function formatNumber(value) {
  if (value === null || value === undefined) {
    return "-";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "-";
  }

  return Math.round(number);
}

function formatWorld(world) {
  switch (world) {
    case "world":
      return "Overworld";
    case "world_nether":
      return "Nether";
    case "world_the_end":
      return "End";
    default:
      return world || "-";
  }
}

function formatCoords(coords) {
  if (!coords) {
    return "-";
  }

  const { x, y, z } = coords;

  if (x === null || y === null || z === null) {
    return "-";
  }

  return `${x}, ${y}, ${z}`;
}

function sortPlayers(list) {
  return [...list].sort((a, b) => {
    if (a.online === b.online) {
      return String(a.name || "").localeCompare(
        String(b.name || "")
      );
    }

    return a.online ? -1 : 1;
  });
}

function getFilteredPlayers() {
  const q = filter.toLowerCase().trim();
  const sortedPlayers = sortPlayers(players);

  if (!q) {
    return sortedPlayers;
  }

  return sortedPlayers.filter(player => {
    const coords = formatCoords(player.coordenadas);

    return [
      player.name,
      player.gamemode,
      player.rango,
      formatWorld(player.mundo),
      player.mundo,
      coords,
      player.online ? "online" : "offline"
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

async function sendCommand(command) {
  const serverId = getCurrentServerId();

  if (!serverId) {
    alert("No hay servidor seleccionado");
    return;
  }

  const response = await fetch(
    "/api/server/command",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: serverId,
        command
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Error enviando comando"
    );
  }

  return data;
}

async function messagePlayer(name) {
  const message = prompt(`Mensaje para ${name}`);

  if (!message || !message.trim()) {
    return;
  }

  await sendCommand(`msg ${name} ${message.trim()}`);
}

async function kickPlayer(name) {
  const reason = prompt(`Motivo para expulsar a ${name}`);

  if (!reason || !reason.trim()) {
    return;
  }

  await sendCommand(`kick ${name} ${reason.trim()}`);
}

async function banPlayer(name) {
  const reason = prompt(`Motivo para banear a ${name}`);

  if (!reason || !reason.trim()) {
    return;
  }

  await sendCommand(`ban ${name} ${reason.trim()}`);
}

async function damagePlayer(name) {
  const amount = Number(
    prompt(`Daño para ${name}`)
  );

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Introduce una cantidad válida");
    return;
  }

  await sendCommand(`damage ${name} ${amount}`);
}

function renderPlayers() {
  const tbody = document.getElementById("players-tbody");
  const summary = document.getElementById("players-summary");

  if (!tbody) {
    return;
  }

  const filteredPlayers = getFilteredPlayers();
  const onlineCount = players.filter(player => player.online).length;

  if (summary) {
    summary.textContent =
      `${onlineCount} online · ${players.length} registrados`;
  }

  if (!filteredPlayers.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">No hay jugadores para mostrar</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredPlayers.map(player => {
    const coords = formatCoords(player.coordenadas);

    const onlineClass = player.online
      ? "player-online"
      : "player-offline";

    return `
      <tr>
        <td>
          <span class="player-status ${onlineClass}">
            ${player.online ? "Online" : "Offline"}
          </span>
        </td>

        <td class="player-name">
          ${safe(player.name)}
        </td>

        <td>${safe(player.gamemode)}</td>
        <td>${safe(player.rango)}</td>
        <td>${formatWorld(player.mundo)}</td>
        <td>${formatNumber(player.vida)}/20</td>
        <td>${formatNumber(player.comida)}/20</td>
        <td>${coords}</td>

        <td class="players-actions-cell">
          <div class="player-actions">
            ${
              player.online
                ? `
                  <button data-action="msg" data-player="${player.name}">
                    MSG
                  </button>

                  <button data-action="damage" data-player="${player.name}">
                    Daño
                  </button>

                  <button data-action="kick" data-player="${player.name}">
                    Kick
                  </button>
                `
                : ""
            }

            <button data-action="ban" data-player="${player.name}">
              Ban
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

async function loadPlayers() {
  const serverId = getCurrentServerId();

  if (!serverId) {
    clearInterval(refreshTimer);

    const tbody = document.getElementById("players-tbody");
    const summary = document.getElementById("players-summary");

    if (summary) {
      summary.textContent = "No hay servidor seleccionado";
    }

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">No hay servidor seleccionado</td>
        </tr>
      `;
    }

    return;
  }

  const response = await fetch(
    `/api/servers/${serverId}/players`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Error cargando jugadores"
    );
  }

  players = Array.isArray(data) ? data : [];

  renderPlayers();
}

function bindEvents() {
  if (eventsBound) {
    return;
  }

  eventsBound = true;

  const input = document.getElementById("players-filter");
  const tbody = document.getElementById("players-tbody");

  if (input) {
    input.addEventListener("input", () => {
      filter = input.value;
      renderPlayers();
    });
  }

  if (tbody) {
    tbody.addEventListener("click", async event => {
      const button = event.target.closest("button[data-action]");

      if (!button) {
        return;
      }

      const action = button.dataset.action;
      const player = button.dataset.player;

      try {
        if (action === "msg") {
          await messagePlayer(player);
        }

        if (action === "damage") {
          await damagePlayer(player);
        }

        if (action === "kick") {
          await kickPlayer(player);
        }

        if (action === "ban") {
          await banPlayer(player);
        }

        await loadPlayers();
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    });
  }
}

export async function iniciarPlayers() {
  clearInterval(refreshTimer);

  bindEvents();

  try {
    await loadPlayers();
  } catch (error) {
    console.error(error);

    const tbody = document.getElementById("players-tbody");

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">Error cargando jugadores</td>
        </tr>
      `;
    }
  }

  refreshTimer = setInterval(() => {
    loadPlayers().catch(console.error);
  }, REFRESH_INTERVAL);
}

window.iniciarPlayers = iniciarPlayers;