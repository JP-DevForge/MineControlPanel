export async function getCurrentServer() {
  const params = new URLSearchParams(window.location.search);
  const serverId = params.get("serverId");

  if (!serverId) {
    return JSON.parse(
      localStorage.getItem("mcp_current_server") || "null"
    );
  }

  const response = await fetch(`/api/servers/${serverId}`);

  if (!response.ok) {
    console.error("Servidor no encontrado en backend:", serverId);
    return null;
  }

  const server = await response.json();

  localStorage.setItem(
    "mcp_current_server",
    JSON.stringify(server)
  );

  return server;
}