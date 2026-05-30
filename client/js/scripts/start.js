const startButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const restartButton = document.getElementById("restart");

startButton?.addEventListener("click", startServer);
stopButton?.addEventListener("click", stopServer);
restartButton?.addEventListener("click", restartServer);

function getActiveServer() {
  const activeServerRaw =
    sessionStorage.getItem("mcp_active_server");

  if (!activeServerRaw) {
    throw new Error("No hay servidor activo");
  }

  return JSON.parse(activeServerRaw);
}

async function startServer() {
  try {
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
      alert(data.message || "No se pudo iniciar el servidor");
      return;
    }
  } catch (error) {
    console.error(error);
    alert("Error iniciando el servidor");
  }
}

async function stopServer() {
  try {
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
      alert(data.error || "No se pudo apagar el servidor");
    }
  } catch (error) {
    console.error(error);
    alert("Error apagando el servidor");
  }
}

async function restartServer() {
  try {
    const activeServer = getActiveServer();

    await fetch("/api/server/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        server: activeServer,
        command: "stop"
      })
    });

    const waitUntilOffline = setInterval(async () => {
      const response = await fetch(
        `/api/server/status/${activeServer.id}`
      );

      const status = await response.json();

      if (status.status !== "offline") {
        return;
      }

      clearInterval(waitUntilOffline);

      await fetch("/api/server/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          server: activeServer
        })
      });
    }, 1000);
  } catch (error) {
    console.error(error);
    alert("Error reiniciando el servidor");
  }
}