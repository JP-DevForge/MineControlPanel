import { loadPanelSection } from "../spa.js";
import { initWorlds } from "./worlds.js";

let statusInterval = null;

export function initPanelWindow(server) {
  renderPanelHeader(server);
  bindPanelNav();
  bindBackButton();
  startStatusPolling(server.id);

  loadAndInitSection(getCurrentSection());
}

function renderPanelHeader(server) {
  const nameElement = document.getElementById("server-name");

  if (!nameElement) return;

  nameElement.textContent = server.name;
}

function bindPanelNav() {
  document.querySelectorAll("[data-panel-section]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      const section = link.dataset.panelSection;

      history.pushState({ section }, "", `#${section}`);
      loadAndInitSection(section);
    });
  });

  window.addEventListener("popstate", () => {
    loadAndInitSection(getCurrentSection());
  });
}

function bindBackButton() {
  document.getElementById("back-home")?.addEventListener("click", () => {
    window.location.href = "/";
  });
}

function getCurrentSection() {
  return location.hash.replace("#", "") || "p1_start";
}

async function loadAndInitSection(section) {
  await loadPanelSection(section);

  switch (section) {
    case "p5_worlds":
      initWorlds();
      break;
  }
}

function startStatusPolling(serverId) {
  if (statusInterval) {
    clearInterval(statusInterval);
  }

  updateServerStatus(serverId);

  statusInterval = setInterval(() => {
    updateServerStatus(serverId);
  }, 5000);
}

async function updateServerStatus(serverId) {
  const startButton =
    document.getElementById("start");

  const stopButton =
    document.getElementById("stop");

  const restartButton =
    document.getElementById("restart");

  try {
    const response = await fetch(
      `/api/server/status/${serverId}`
    );

    if (!response.ok) return;

    const status = await response.json();

    const element =
      document.getElementById("server-status");

    const estadoBox =
      document.querySelector(".estado");

    if (!element) return;

    element.className = "";

    estadoBox?.classList.remove(
      "estado-online",
      "estado-offline",
      "estado-unknown"
    );

    if (status.status === "online") {
      const players = status.players || {};

      element.textContent =
        `Online (${players.online ?? 0}/${players.max ?? 0})`;

      element.classList.add("status-online");
      estadoBox?.classList.add("estado-online");

      startButton?.classList.add("hidden");

      stopButton?.classList.remove("hidden");
      restartButton?.classList.remove("hidden");

      return;
    }

    if (status.status === "offline") {
      element.textContent = "Offline";

      element.classList.add("status-offline");
      estadoBox?.classList.add("estado-offline");

      startButton?.classList.remove("hidden");

      stopButton?.classList.add("hidden");
      restartButton?.classList.add("hidden");

      return;
    }

    element.textContent = "Comprobando...";

    element.classList.add("status-unknown");
    estadoBox?.classList.add("estado-unknown");

    startButton?.classList.add("hidden");
    stopButton?.classList.add("hidden");
    restartButton?.classList.add("hidden");

  } catch {
    const element =
      document.getElementById("server-status");

    const estadoBox =
      document.querySelector(".estado");

    if (!element) return;

    element.textContent = "Comprobando...";
    element.className = "status-unknown";

    estadoBox?.classList.remove(
      "estado-online",
      "estado-offline",
      "estado-unknown"
    );

    estadoBox?.classList.add("estado-unknown");

    startButton?.classList.add("hidden");
    stopButton?.classList.add("hidden");
    restartButton?.classList.add("hidden");
  }
}