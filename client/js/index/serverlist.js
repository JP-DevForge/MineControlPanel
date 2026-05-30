import { escapeHtml } from "./functions.js";
import { connectServer } from "./botones.js";

let statusInterval = null;

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

<div
  id="status-${server.id}"
  class="server-status status-unknown"
>
  ●
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

  startStatusPolling();
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
  const serverPath = server.path || "";
  const jar = server.jar || "";

  return `${escapeHtml(serverPath)} ${escapeHtml(jar)}`;
}

function startStatusPolling() {
  if (statusInterval) {
    clearInterval(statusInterval);
  }

  loadServerStatuses();

  statusInterval = setInterval(() => {
    loadServerStatuses();
  }, 5000);
}

async function loadServerStatuses() {
  try {
    const response = await fetch("/api/servers/status");

    if (!response.ok) return;

    const data = await response.json();

    if (!data.success || !Array.isArray(data.servers)) return;

    data.servers.forEach(updateServerStatus);
  } catch (error) {
    console.error("Error cargando estados:", error);
  }
}

function updateServerStatus(server) {
  const element = document.getElementById(`status-${server.serverId}`);

  if (!element) return;

  element.className = "server-status";

if (server.status === "online") {
  const players = server.players || {};

  element.textContent =
    `Online (${players.online ?? 0}/${players.max ?? 0})`;

  element.classList.add("status-online");
  return;
}

if (server.status === "offline") {
  element.textContent = "Offline";
  element.classList.add("status-offline");
  return;
}

element.textContent = "Desconocido";
element.classList.add("status-unknown");
}