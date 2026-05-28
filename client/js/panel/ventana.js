import { loadPanelSection } from "../spa.js";

export function initPanelWindow(server) {
  renderPanelHeader(server);
  bindPanelNav();
  bindBackButton();

  loadPanelSection(getCurrentSection());
}

function renderPanelHeader(server) {
  document.getElementById("server-name").textContent = server.name;
  document.getElementById("server-path").textContent =
    server.path || "Servidor local";
}

function bindPanelNav() {
  document.querySelectorAll("[data-panel-section]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();

      const section = link.dataset.panelSection;

      history.pushState({ section }, "", `#${section}`);
      loadPanelSection(section);
    });
  });

  window.addEventListener("popstate", () => {
    loadPanelSection(getCurrentSection());
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