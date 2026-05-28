const startButton = document.getElementById("start");

if (startButton) {
  startButton.addEventListener("click", startServer);
}

async function startServer() {
  const activeServerRaw = sessionStorage.getItem("mcp_active_server");

  if (!activeServerRaw) {
    alert("No hay servidor activo");
    return;
  }

  const activeServer = JSON.parse(activeServerRaw);

  try {
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

    alert(data.message);

  } catch (error) {
    console.error(error);
    alert("Error iniciando el servidor");
  }
}