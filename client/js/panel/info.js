
function getActiveServer() {
  const activeServerRaw =
    sessionStorage.getItem("mcp_active_server");

  if (!activeServerRaw) {
    throw new Error("No hay servidor activo");
  }

  return JSON.parse(activeServerRaw);
}

function formatBytes(bytes) {
  const gb = bytes / 1024 / 1024 / 1024;

  return `${gb.toFixed(1)} GB`;
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}min`;
  }

  return `${hours}h ${minutes}min`;
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (!element) {
    return;
  }

  element.textContent = value;
}

async function loadSystemInfo() {

  try {
    const activeServer = getActiveServer();

    const response =
      await fetch("/api/system/info");

    const data = await response.json();


    if (!response.ok) {
      throw new Error(
        data.error ||
        "No se pudo cargar la información"
      );
    }

    setText(
      "status-server-address",
      `${data.ip}:${activeServer.port || 25565}`
    );

    setText(
      "status-server-version",
      activeServer.version || "No detectada"
    );

    setText(
      "status-system-hostname",
      data.hostname || "No disponible"
    );

    setText(
      "status-system-platform",
      `${data.platform} ${data.arch}`
    );

    setText(
      "status-system-cpu",
      data.cpu || "No disponible"
    );

    setText(
      "status-system-cores",
      data.cpuCores ?? "No disponible"
    );

    setText(
      "status-system-ram",
      `${formatBytes(data.ram.used)} / ${formatBytes(data.ram.total)} (${data.ram.usedPercent}%)`
    );

    setText(
      "status-system-temp",
      data.temperature === null
        ? "No disponible"
        : `${data.temperature} ºC`
    );

    setText(
      "status-system-uptime",
      formatUptime(data.uptime)
    );

  } catch (error) {
    console.error(error);

    setText(
      "status-server-address",
      "Error"
    );

    setText(
      "status-server-version",
      "Error"
    );

    setText(
      "status-system-hostname",
      "Error"
    );

    setText(
      "status-system-platform",
      "Error"
    );

    setText(
      "status-system-cpu",
      "Error"
    );

    setText(
      "status-system-cores",
      "Error"
    );

    setText(
      "status-system-ram",
      "Error"
    );

    setText(
      "status-system-temp",
      "Error"
    );

    setText(
      "status-system-uptime",
      "Error"
    );
  }
}

export async function initInfo() {
  await loadSystemInfo();
}