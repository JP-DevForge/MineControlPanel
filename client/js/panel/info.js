console.log("info.js cargado");

let statusInterval = null;

function getActiveServer() {
  const raw = sessionStorage.getItem("mcp_active_server");

  if (!raw) {
    throw new Error("No hay servidor activo");
  }

  return JSON.parse(raw);
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes)) {
    return "No disponible";
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

async function loadStatus() {
  const activeServer = getActiveServer();

  try {
    const [systemResponse, statusResponse] = await Promise.all([
      fetch("/api/system/info"),
      fetch(`/api/server/status/${activeServer.id}`)
    ]);

    const system = await systemResponse.json();
    const status = await statusResponse.json();

    setText("status-server-ip", system.ip || activeServer.ip || "127.0.0.1");
    setText("status-server-port", activeServer.port || status.port || 25565);
    setText("status-server-version", status.version || activeServer.version || "No detectada");

    if (system.ram) {
      setText(
        "status-system-ram",
        `${formatBytes(system.ram.used)} / ${formatBytes(system.ram.total)} (${system.ram.usedPercent}%)`
      );
    } else {
      setText("status-system-ram", "No disponible");
    }

    setText(
      "status-system-temp",
      system.temperature === null || system.temperature === undefined
        ? "No disponible"
        : `${system.temperature} ºC`
    );

  } catch (error) {
    console.error(error);

    setText("status-server-ip", activeServer.ip || "127.0.0.1");
    setText("status-server-port", activeServer.port || 25565);
    setText("status-server-version", activeServer.version || "No detectada");
    setText("status-system-ram", "No disponible");
    setText("status-system-temp", "No disponible");
  }
}

async function loadVersionList() {
  const select = document.getElementById("version-list");
  const applyButton = document.getElementById("apply-version");

  if (!select || !applyButton) return;

  select.classList.toggle("hidden");
  applyButton.classList.toggle("hidden");

  if (select.dataset.loaded === "true") return;

  try {
    const response = await fetch("/api/vanilla/versions");
    const data = await response.json();

    const versions = data.versions || data || [];

    select.innerHTML = "";

    if (!Array.isArray(versions) || versions.length === 0) {
      select.innerHTML = `<option value="">No hay versiones disponibles</option>`;
      return;
    }

    for (const version of versions) {
      const versionId = version.id || version.version || version.name || version;

      const option = document.createElement("option");
      option.value = versionId;
      option.textContent = versionId;

      select.appendChild(option);
    }

    select.dataset.loaded = "true";

  } catch (error) {
    console.error(error);
    select.innerHTML = `<option value="">Error cargando versiones</option>`;
  }
}

async function applyVersion() {
  const activeServer = getActiveServer();
  const select = document.getElementById("version-list");
  const message = document.getElementById("version-message");

  if (!select || !select.value) {
    setText("version-message", "Selecciona una versión");
    return;
  }

  const version = select.value;

  try {
    setText("version-message", "Comprobando servidor...");

    const statusResponse = await fetch(`/api/server/status/${activeServer.id}`);
    const status = await statusResponse.json();

    if (status.status !== "offline" && status.status !== "stopped") {
      setText("version-message", "Apaga el servidor antes de cambiar la versión");
      return;
    }

    setText("version-message", "Descargando y aplicando versión...");

    const response = await fetch(`/api/server/${activeServer.id}/version`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ version })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
      throw new Error(result.error || "No se pudo aplicar la versión");
    }

    activeServer.version = version;
    activeServer.jar = result.jar || activeServer.jar;

    sessionStorage.setItem(
      "mcp_active_server",
      JSON.stringify(activeServer)
    );

    setText("status-server-version", version);
    setText("version-message", "Versión aplicada correctamente");

  } catch (error) {
    console.error(error);
    setText("version-message", error.message || "Error aplicando versión");
  }
}

function startStatusInterval() {
  stopStatusInterval();
  statusInterval = setInterval(loadStatus, 3000);
}

function stopStatusInterval() {
  if (statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }
}

export async function initInfo() {
  stopStatusInterval();

  await loadStatus();

  const versionButton = document.getElementById("open-version-list");
  const applyButton = document.getElementById("apply-version");

  if (versionButton) {
    versionButton.addEventListener("click", loadVersionList);
  }

  if (applyButton) {
    applyButton.addEventListener("click", applyVersion);
  }

  startStatusInterval();
}

export function stopInfo() {
  stopStatusInterval();
}