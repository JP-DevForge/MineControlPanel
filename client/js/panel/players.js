let players = [];
let filter = "";
let refreshTimer = null;

const REFRESH_INTERVAL = 1000;

function getCurrentServerId() {
  const raw =
    sessionStorage.getItem("mcp_active_server") ||
    localStorage.getItem("mcp_active_server") ||
    sessionStorage.getItem("activeServer") ||
    localStorage.getItem("activeServer");

  if (raw) {
    try {
      const server = JSON.parse(raw);
      return server.id || server.uuid || server.serverId || null;
    } catch {
      return null;
    }
  }

  const params = new URLSearchParams(window.location.search);

  return (
    params.get("id") ||
    params.get("server") ||
    params.get("serverId") ||
    params.get("uuid")
  );
}

function safe(value) {
  return value ?? "-";
}

function formatNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : "-";
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
  if (!coords) return "-";

  const { x, y, z } = coords;

  if (x === null || y === null || z === null) {
    return "-";
  }

  return `${x}, ${y}, ${z}`;
}

function sortPlayers(list) {
  return [...list].sort((a, b) => {
    if (a.online === b.online) {
      return String(a.name || "").localeCompare(String(b.name || ""));
    }

    return a.online ? -1 : 1;
  });
}

function getFilteredPlayers() {
  const q = filter.toLowerCase().trim();
  const sorted = sortPlayers(players);

  if (!q) return sorted;

  return sorted.filter(player => {
    return [
      player.name,
      player.gamemode,
      player.rango,
      formatWorld(player.mundo),
      player.mundo,
      formatCoords(player.coordenadas),
      player.online ? "online" : "offline",
      player.banned ? "baneado" : "",
      player.whitelisted ? "whitelist" : ""
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
}

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || "Respuesta inválida del servidor");
  }
}

async function sendCommand(command) {
  const serverId = getCurrentServerId();

  if (!serverId) {
    alert("No hay servidor seleccionado");
    return null;
  }

  const response = await fetch("/api/server/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      id: serverId,
      command
    })
  });

  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Error enviando comando");
  }

  return data;
}

async function loadPlayers() {
  const serverId = getCurrentServerId();

  if (!serverId) {
    clearInterval(refreshTimer);
    return;
  }

  const response = await fetch(`/api/servers/${serverId}/players`);
  const data = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Error cargando jugadores");
  }

  players = Array.isArray(data) ? data : [];

  renderPlayers();
}

async function messagePlayer(name) {
  const message = prompt(`Mensaje para ${name}`);

  if (message?.trim()) {
    await sendCommand(`msg ${name} ${message.trim()}`);
  }
}

async function kickPlayer(name) {
  const reason = prompt(`Motivo para expulsar a ${name}`);

  if (reason?.trim()) {
    await sendCommand(`kick ${name} ${reason.trim()}`);
    await loadPlayers();
  }
}

async function banPlayer(name) {
  const reason = prompt(`Motivo para banear a ${name}`);

  if (reason?.trim()) {
    await sendCommand(`ban ${name} ${reason.trim()}`);
    await loadPlayers();
  }
}

async function unbanPlayer(name) {
  await sendCommand(`pardon ${name}`);
  await loadPlayers();
}

async function damagePlayer(name) {
  const amount = Number(prompt(`Daño para ${name}`));

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Introduce una cantidad válida");
    return;
  }

  await sendCommand(`damage ${name} ${amount}`);
  await loadPlayers();
}

async function enableWhitelist(enabled) {
  await sendCommand(enabled ? "whitelist on" : "whitelist off");
}

async function toggleWhitelist(name, enabled) {
  await sendCommand(
    enabled
      ? `whitelist add ${name}`
      : `whitelist remove ${name}`
  );

  await loadPlayers();

  if (document.getElementById("whitelist-modal")) {
    renderWhitelistModal();
  }
}

function renderPlayers() {
  const tbody = document.getElementById("players-tbody");
  const summary = document.getElementById("players-summary");

  if (!tbody) return;

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

        <td class="player-name">${safe(player.name)}</td>
        <td>${safe(player.gamemode)}</td>
        <td>${safe(player.rango)}</td>
        <td>${formatWorld(player.mundo)}</td>
        <td>${formatNumber(player.vida)}/20</td>
        <td>${formatNumber(player.comida)}/20</td>
        <td>${formatCoords(player.coordenadas)}</td>

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

            <button
              data-action="${player.banned ? "unban" : "ban"}"
              data-player="${player.name}"
            >
              ${player.banned ? "Unban" : "Ban"}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function renderWhitelistModal() {
  const oldModal = document.getElementById("whitelist-modal");

  if (oldModal) {
    oldModal.remove();
  }

  const modal = document.createElement("div");

  modal.id = "whitelist-modal";
  modal.className = "whitelist-modal";

  modal.innerHTML = `
    <div class="whitelist-box">
      <header>
        <h3>Whitelist</h3>
        <button id="close-whitelist" type="button">×</button>
      </header>

      <div class="whitelist-list">
        ${sortPlayers(players).map(player => `
          <div class="whitelist-player">
            <span>${player.name}</span>

            <label class="switch">
              <input
                type="checkbox"
                data-player="${player.name}"
                ${player.whitelisted ? "checked" : ""}
              >
              <span class="slider"></span>
            </label>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeButton = document.getElementById("close-whitelist");

  if (closeButton) {
    closeButton.onclick = () => {
      modal.remove();
    };
  }

  modal
    .querySelectorAll("input[type='checkbox']")
    .forEach(input => {
      input.onchange = async () => {
        const previousValue = !input.checked;

        try {
          await toggleWhitelist(
            input.dataset.player,
            input.checked
          );
        } catch (error) {
          alert(error.message);
          input.checked = previousValue;
        }
      };
    });
}

function setupListeners() {
  const input = document.getElementById("players-filter");
  const tbody = document.getElementById("players-tbody");
  const whitelistEnabled = document.getElementById("whitelist-enabled");

  if (input) {
    input.oninput = () => {
      filter = input.value;
      renderPlayers();
    };
  }

  if (whitelistEnabled) {
    whitelistEnabled.onchange = async () => {
      const previousValue = !whitelistEnabled.checked;

      try {
        await enableWhitelist(whitelistEnabled.checked);
      } catch (error) {
        alert(error.message);
        whitelistEnabled.checked = previousValue;
      }
    };
  }

  if (tbody) {
    tbody.onclick = async event => {
      const button = event.target.closest("button[data-action]");

      if (!button) return;

      const action = button.dataset.action;
      const player = button.dataset.player;

      try {
        if (action === "msg") await messagePlayer(player);
        if (action === "damage") await damagePlayer(player);
        if (action === "kick") await kickPlayer(player);
        if (action === "ban") await banPlayer(player);
        if (action === "unban") await unbanPlayer(player);

        await loadPlayers();
      } catch (error) {
        console.error(error);
        alert(error.message);
      }
    };
  }
}

document.addEventListener("click", event => {
  const button = event.target.closest("#open-whitelist");

  if (!button) {
    return;
  }

  event.preventDefault();
  renderWhitelistModal();
});

export async function iniciarPlayers() {
  clearInterval(refreshTimer);

  setupListeners();

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