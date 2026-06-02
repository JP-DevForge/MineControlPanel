import { loadSection } from "./selection.js";
import { renderServers } from "./serverlist.js";
import { addLocalServer } from "./botones.js";
import { initCreateServer } from "./createServer.js";
  import { logout } from "../auth.js";
export async function renderHome() {

  if (!await loadSection("selector", "home")) {
    return;
  }

  document
    .getElementById("open-add-server")
    ?.addEventListener("click", showAddLocalServerForm);

  document
    .getElementById("open-create-server")
    ?.addEventListener("click", showCreateServerScreen);
  document
    .getElementById("logout-button")
    ?.addEventListener("click", logout);
  renderServers();

}

export async function showAddLocalServerForm() {
  if (!await loadSection("selector", "addLocalServer")) {
    return;
  }

  document
    .getElementById("back-home")
    ?.addEventListener("click", renderHome);

  document
    .getElementById("add-local-server-form")
    ?.addEventListener("submit", addLocalServer);
}

export async function showCreateServerScreen() {
  if (!await loadSection("selector", "createServer")) {
    return;
  }

  initCreateServer();
}