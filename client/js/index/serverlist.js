import { escapeHtml } from "./functions.js";
import { connectServer } from "./botones.js";

export async function renderServers() {
  const list = document.getElementById("servers-list");

  if (!list) return;

  const servers = await getServers();

  if (servers.length === 0) {
    list.innerHTML = `<div class="empty-message">No hay servidores guardados.</div>`;
    return;
  }

  list.innerHTML = servers.map(server => `
    <article class="server-item">
      <div class="server-info">
        <h3>${escapeHtml(server.name)}</h3>
        <p>${getServerDescription(server)}</p>
      </div>

      <div class="server-actions">
        <button class="boton" data-action="connect" data-id="${server.id}">
          ▶
        </button>

        <button class="boton botoneliminar" data-action="delete" data-id="${server.id}">
          ✕
        </button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-action='connect']").forEach(button => {
    button.addEventListener("click", () => connectServer(button.dataset.id));
  });

  list.querySelectorAll("[data-action='delete']").forEach(button => {
    button.addEventListener("click", () => deleteServer(button.dataset.id));
  });
}

async function getServers() {
  const response = await fetch("/api/servers");

  if (!response.ok) {
    return [];
  }

  return await response.json();
}

async function deleteServer(id) {
  if (!confirm("¿Eliminar este servidor?")) return;

  await fetch(`/api/servers/${id}`, {
    method: "DELETE"
  });

  renderServers();
}

function getServerDescription(server) {
  const path = server.path || "";
  const jar = server.jar || "";

  return `${escapeHtml(path)} ${escapeHtml(jar)}`;
}