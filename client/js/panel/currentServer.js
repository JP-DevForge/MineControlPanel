export function getCurrentServer() {
  const params = new URLSearchParams(window.location.search);
  const serverId = params.get("serverId");

  const servers = JSON.parse(
    localStorage.getItem("mcp_saved_servers") || "[]"
  );

  if (serverId) {
    const server = servers.find(server => server.id === serverId);

    if (server) {
      localStorage.setItem(
        "mcp_current_server",
        JSON.stringify(server)
      );

      return server;
    }
  }

  return JSON.parse(
    localStorage.getItem("mcp_current_server") || "null"
  );
}