import { renderHome } from "./ventana.js";

export async function addLocalServer(event) {
  event.preventDefault();

  const name = document.getElementById("local-server-name").value.trim();
  const path = document.getElementById("local-server-path").value.trim();
  const jar = document.getElementById("local-server-jar").value.trim();
  const port = Number(document.getElementById("local-server-port").value);

  if (!name || !path || !jar || !port) {
    alert("Rellena todos los campos");
    return;
  }

  const response = await fetch("/api/servers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "local",
      name,
      path,
      jar,
      port
    })
  });

  if (!response.ok) {
    alert("Error guardando el servidor");
    return;
  }

  renderHome();
}

export async function connectServer(id) {
  const response = await fetch("/api/servers");

  if (!response.ok) {
    alert("No se pudo cargar la lista de servidores");
    return;
  }

  const servers = await response.json();
  const server = servers.find(item => item.id === id);

  if (!server) {
    alert("Servidor no encontrado");
    return;
  }

  sessionStorage.setItem("mcp_active_server", JSON.stringify({
    id: server.id,
    type: server.type,
    name: server.name,
    path: server.path,
    jar: server.jar,
    port: server.port,
    baseUrl: window.location.origin
  }));

window.location.href = `/panel?serverId=${server.id}`;
}