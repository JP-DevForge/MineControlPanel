import "./console.js";
import "./players.js";
import { initPanelWindow } from "./ventana.js";

document.addEventListener("DOMContentLoaded", () => {
  const activeServerRaw = sessionStorage.getItem("mcp_active_server");

  if (!activeServerRaw) {
    window.location.href = "/";
    return;
  }

  const activeServer = JSON.parse(activeServerRaw);

  initPanelWindow(activeServer);
});