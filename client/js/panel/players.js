import { getCurrentServer } from "./currentServer.js";

async function iniciarPlayers() {
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

        renderPlayers(data);

    } catch (error) {
        console.error(error);

        const container = document.querySelector(".players-list");

        if (container) {
            container.innerHTML = `
        <p class="empty-message">
          Error cargando jugadores.
        </p>
      `;
        }
    }
}

function renderPlayers(players) {
    const tbody = document.getElementById("tbody");
    const count = document.getElementById("count");

    if (!tbody) {
        console.error("No existe #tbody");
        return;
    }

    if (!players || players.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="6" class="muted">
          No hay jugadores registrados
        </td>
      </tr>
    `;

        if (count) {
            count.textContent = "0 jugadores";
        }

        return;
    }

    tbody.innerHTML = players.map(player => `
    <tr>
      <td>
        <img
          src="https://mc-heads.net/avatar/${player.uuid}/32"
          alt="${player.name}"
        >
      </td>

      <td>${player.name}</td>

      <td>${player.gamemode}</td>

      <td>${player.rango}</td>

      <td>${player.mundo}</td>

      <td>
        <button>Info</button>
      </td>
    </tr>
  `).join("");

    if (count) {
        count.textContent = `${players.length} jugadores`;
    }
}
window.iniciarPlayers = iniciarPlayers;