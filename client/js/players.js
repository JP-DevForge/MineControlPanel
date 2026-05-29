import { getCurrentServer } from "./currentServer.js";

let allPlayers = [];
let filteredPlayers = [];
let selectedId = null;

window.enviarMsg = function (player) {
  const texto = prompt("Mensaje para " + player);

  if (texto && texto.trim() !== "") {
    mcCommand("msg " + player + " " + texto);
  }
};

window.enviarKick = function (player) {
  const texto = prompt("Motivo de expulsión para " + player);

  if (texto && texto.trim() !== "") {
    mcCommand("kick " + player + " " + texto);
  }
};

window.enviarBan = function (player) {
  const texto = prompt("Motivo de baneo para " + player);

  if (texto && texto.trim() !== "") {
    mcCommand("ban " + player + " " + texto);
  }
};

window.enviarDamage = function (player) {
  let cantidad = prompt("Cantidad de daño a " + player);
  cantidad = Number(cantidad);

  if (!isNaN(cantidad) && cantidad > 0) {
    mcCommand("damage " + player + " " + cantidad);
  } else {
    alert("Introduce un número válido");
  }
};

window.updatePlayers = async function () {
  await cargarPlayers();
};

async function iniciarPlayers() {
  const filterInput = document.getElementById("filter");
  const tbody = document.getElementById("tbody");

  if (!tbody) {
    console.error("No existe #tbody");
    return;
  }

  if (filterInput) {
    filterInput.addEventListener("input", applyFilter);
  }

  tbody.addEventListener("click", function (e) {
    const tr = e.target.closest("tr[data-id]");

    if (!tr) return;

    selectedId = tr.dataset.id;
    renderTable();
  });

  await cargarPlayers();
}

async function cargarPlayers() {
  const server = getCurrentServer();

  if (!server) {
    console.error("No hay servidor seleccionado");
    return;
  }

  try {
    const response = await fetch(
      `/api/servers/${server.id}/players`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error cargando jugadores");
    }

    allPlayers = Array.isArray(data) ? data : [];
    filteredPlayers = allPlayers;

    if (allPlayers.length > 0 && !selectedId) {
      selectedId = allPlayers[0].uuid;
    }

    applyFilter();

  } catch (error) {
    console.error(error);

    const tbody = document.getElementById("tbody");

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="muted">
            Error cargando jugadores.
          </td>
        </tr>
      `;
    }
  }
}

function applyFilter() {
  const filterInput = document.getElementById("filter");
  const count = document.getElementById("count");

  const q = filterInput
    ? filterInput.value.toLowerCase()
    : "";

  filteredPlayers = allPlayers.filter(player => {
    const c = player.coordenadas || {};

    const text = [
      player.name,
      player.gamemode,
      player.rango,
      player.mundo,
      c.x,
      c.y,
      c.z
    ].join(" ").toLowerCase();

    return text.includes(q);
  });

  renderTable();

  if (count) {
    count.textContent = `${filteredPlayers.length} / ${allPlayers.length}`;
  }
}

function renderTable() {
  const tbody = document.getElementById("tbody");

  if (!tbody) return;

  if (filteredPlayers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="muted">
          No hay resultados
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredPlayers.map(player => {
    const selected = player.uuid === selectedId;
    const selectedClass = selected ? "selected" : "";

    let html = `
      <tr class="${selectedClass}" data-id="${player.uuid}">
        <td>
          <img
            src="https://mineskin.eu/helm/${player.name}/100.png"
            alt="skin"
          >
        </td>

        <td>${player.name}</td>
        <td>${player.gamemode}</td>

        <td>
          <button onclick="mcCommand('op ${player.name}'); updatePlayers()">⬆️</button>
          ${player.rango}
          <button onclick="mcCommand('deop ${player.name}'); updatePlayers()">⬇️</button>
        </td>

        <td>${player.mundo}</td>

        <td>
          <button onclick="enviarMsg('${player.name}')">Mensaje</button>
          <button onclick="enviarKick('${player.name}')">Expulsar</button>
          <button onclick="enviarBan('${player.name}')">Banear</button>
        </td>
      </tr>
    `;

    if (selected) {
      html += `
        <tr class="detail-row">
          <td colspan="6">
            ${buildDetailHtml(player)}
          </td>
        </tr>
      `;
    }

    return html;
  }).join("");
}

function buildDetailHtml(player) {
  const c = player.coordenadas || {};

  return `
    <div class="kvs">
      <div class="key">Jugador</div>
      <div class="val">${player.name}</div>

      <div class="key">Modo de Juego</div>
      <div class="val">${player.gamemode}</div>

      <div class="key">Rango</div>
      <div class="val">${player.rango}</div>

      <div class="key">Mundo</div>
      <div class="val">${player.mundo}</div>

      <div class="key">Vida</div>
      <div class="val">
        ${player.vida}/20
        <button onclick="enviarDamage('${player.name}')">Dañar</button>
      </div>

      <div class="key">Comida</div>
      <div class="val">${player.comida}/20</div>

      <div class="key">Coordenadas actuales</div>
      <div class="val">
        x=${c.x}, y=${c.y}, z=${c.z}
      </div>
    </div>
  `;
}

window.iniciarPlayers = iniciarPlayers;