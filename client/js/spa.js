import { getCurrentServer } from "./panel/currentServer.js";
import { renderConfig } from "./panel/config.js";
import { iniciarBackups } from "./panel/backups.js";
import { initInfo } from "./panel/info.js";

const contentDiv = document.getElementById("content");

const cssMap = {
  p1_start: "/css/p1_start.css",
  p2_console: "/css/p2_console.css",
  p3_config: "/css/p3_config.css",
  p4_players: "/css/p4_players.css",
  p5_worlds: "/css/p5_worlds.css",
  p6_contact: "/css/p6_contact.css"
};

const sectionInitMap = {
  p1_start: "initInfo",
  p2_console: "iniciarConsole",
  p3_config: "iniciarConfigPage",
  p4_players: "iniciarPlayers"
};

window.initInfo = initInfo;

window.iniciarConfigPage = function () {
  iniciarConfig();
  iniciarBackups();
};

window.iniciarConfig = async function () {
  const server = await getCurrentServer();

  if (!server) {
    console.error("No hay servidor seleccionado");
    return;
  }

  renderConfig(server);
};

export async function loadPanelSection(name) {
  if (!contentDiv) {
    console.error("No existe #content");
    return false;
  }

  try {
    const response = await fetch(`/sections/panel/${name}.html`);

    if (!response.ok) {
      throw new Error(
        `No se pudo cargar /sections/panel/${name}.html`
      );
    }

    contentDiv.innerHTML = await response.text();

    updateActiveNav(name);
    loadSectionCss(name);
    initSection(name);

    return true;

  } catch (error) {
    console.error(error);

    contentDiv.innerHTML = `
      <p class="empty-message">
        Error cargando la sección.
      </p>
    `;

    return false;
  }
}

function updateActiveNav(name) {
  document
    .querySelectorAll("[data-panel-section]")
    .forEach(link => {
      link.classList.toggle(
        "activo",
        link.dataset.panelSection === name
      );
    });
}

function loadSectionCss(name) {
  document.getElementById("section-css")?.remove();

  const href = cssMap[name];

  if (!href) {
    return;
  }

  const link = document.createElement("link");

  link.id = "section-css";
  link.rel = "stylesheet";
  link.href = href;

  document.head.appendChild(link);
}

function initSection(name) {
  const initFunctionName = sectionInitMap[name];

  if (!initFunctionName) {
    return;
  }

  const initFunction = window[initFunctionName];

  if (typeof initFunction === "function") {
    initFunction();
  }
}