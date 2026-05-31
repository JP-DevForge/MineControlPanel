const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");

let statusLockUntil = 0;

startButton?.addEventListener("click", startServer);
stopButton?.addEventListener("click", stopServer);

function getActiveServer() {
  const activeServerRaw =
    sessionStorage.getItem("mcp_active_server");

  if (!activeServerRaw) {
    throw new Error("No hay servidor activo");
  }

  return JSON.parse(activeServerRaw);
}

function setTemporaryStatus(text, seconds = 30) {
  const statusElement =
    document.getElementById("server-status");

  if (!statusElement) {
    return;
  }

  statusLockUntil =
    Date.now() + (seconds * 1000);

  statusElement.textContent = text;
  statusElement.className = "status unknown";
}

function isStatusLocked() {
  return Date.now() < statusLockUntil;
}

async function startServer() {
  try {
    setTemporaryStatus("Encendiendo...", 30);

    const activeServer = getActiveServer();

    const response = await fetch("/api/server/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        server: activeServer
      })
    });

    const data = await response.json();

    if (!response.ok) {
      statusLockUntil = 0;

      alert(
        data.error ||
        "No se pudo iniciar el servidor"
      );

      return;
    }
  } catch (error) {
    statusLockUntil = 0;

    console.error(error);

    alert("Error iniciando el servidor");
  }
}

async function stopServer() {
  try {
    setTemporaryStatus("Apagando...", 30);

    const activeServer = getActiveServer();

    const response = await fetch("/api/server/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: activeServer.id,
        command: "stop"
      })
    });

    const data = await response.json();

    if (!response.ok) {
      statusLockUntil = 0;

      alert(
        data.error ||
        "No se pudo apagar el servidor"
      );

      return;
    }
  } catch (error) {
    statusLockUntil = 0;

    console.error(error);

    alert("Error apagando el servidor");
  }
}

window.isStatusLocked = isStatusLocked;