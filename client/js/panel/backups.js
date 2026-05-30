import { getCurrentServer } from "./currentServer.js";

let currentServer = null;

export async function iniciarBackups() {
  currentServer = await getCurrentServer();

  if (!currentServer) {
    return;
  }

  await loadBackupConfig();
  await loadBackups();

  setupEvents();
}

async function loadBackupConfig() {
  try {
    const response = await fetch(
      "/api/server/backups/config",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          serverId: currentServer.id
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      return;
    }

    document.getElementById("backup-path").textContent =
      data.config.backupPath || "No configurada";

    document.getElementById("backup-size").textContent =
      data.config.totalSize || "0 MB";

    document.getElementById("automatic-backups").checked =
      data.config.automaticBackups;

    document.getElementById("backup-on-start").checked =
      data.config.backupOnStart;

    document.getElementById("backup-interval").value =
      data.config.automaticIntervalMinutes;

    document.getElementById("backup-limit").value =
      data.config.maxAutomaticBackups;

  } catch (error) {
    console.error(error);
  }
}

async function loadBackups() {
  try {
    const response = await fetch(
      "/api/server/backups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          serverId: currentServer.id
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      return;
    }

    renderBackups(data.backups);

  } catch (error) {
    console.error(error);
  }
}

function renderBackups(backups) {
  const container =
    document.getElementById("backup-list");

  if (!container) {
    return;
  }

  if (!backups.length) {
    container.innerHTML = `
      <p class="empty-message">
        No hay backups
      </p>
    `;
    return;
  }

  container.innerHTML = "";

  backups.forEach(backup => {
    const item = document.createElement("div");

    item.className = "backup-item";

    item.innerHTML = `
      <span>
        ${backup.reason}
        ${formatDate(backup.createdAt)}
      </span>

      <div class="backup-actions">

        <button
          class="restore-backup"
          data-id="${backup.id}">
          Restaurar
        </button>

        <button
          class="delete-backup"
          data-id="${backup.id}">
          Eliminar
        </button>

      </div>
    `;

    container.appendChild(item);
  });
}

function setupEvents() {
  document
    .getElementById("edit-backup-path")
    ?.addEventListener(
      "click",
      changeBackupPath
    );

  document
    .getElementById("create-backup")
    ?.addEventListener(
      "click",
      createBackup
    );

  document
    .getElementById("backup-list")
    ?.addEventListener(
      "click",
      handleBackupButtons
    );

  document
    .getElementById("automatic-backups")
    ?.addEventListener(
      "change",
      saveConfig
    );

  document
    .getElementById("backup-on-start")
    ?.addEventListener(
      "change",
      saveConfig
    );

  document
    .getElementById("backup-interval")
    ?.addEventListener(
      "change",
      saveConfig
    );

  document
    .getElementById("backup-limit")
    ?.addEventListener(
      "change",
      saveConfig
    );
}

async function changeBackupPath() {
  const current =
    document.getElementById("backup-path").textContent;

  const newPath = prompt(
    "Ruta de backups",
    current === "No configurada" ? "" : current
  );

  if (newPath === null) {
    return;
  }

  const saved = await saveConfig({
    backupPath: newPath.trim()
  });

  if (!saved) {
    return;
  }

  alert("Ruta de backups guardada");
}

async function saveConfig(extra = {}) {
  try {
    const response = await fetch("/api/server/backups/config/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        serverId: currentServer.id,

        backupPath:
          extra.backupPath ??
          document.getElementById("backup-path").textContent,

        automaticBackups:
          document.getElementById("automatic-backups").checked,

        backupOnStart:
          document.getElementById("backup-on-start").checked,

        automaticIntervalMinutes:
          Number(document.getElementById("backup-interval").value),

        maxAutomaticBackups:
          Number(document.getElementById("backup-limit").value)
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      alert(data.error || "Ruta de backups no válida");
      return false;
    }

    await loadBackupConfig();
    return true;

  } catch (error) {
    console.error(error);
    alert("No se pudo guardar la configuración de backups");
    return false;
  }
}

async function createBackup() {
  const hasPath =
    await ensureBackupPathConfigured();

  if (!hasPath) {
    return;
  }

  const reason =
    prompt("Motivo del backup:");

  if (!reason) {
    return;
  }

  try {
    await fetch(
      "/api/server/backups/create",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          serverId: currentServer.id,
          reason
        })
      }
    );

    await loadBackups();

  } catch (error) {
    console.error(error);
  }
}

async function handleBackupButtons(event) {
  const backupId =
    event.target.dataset.id;

  if (!backupId) {
    return;
  }

  if (
    event.target.classList.contains(
      "restore-backup"
    )
  ) {
    if (
      !confirm(
        "¿Restaurar este backup?"
      )
    ) {
      return;
    }

    await fetch(
      "/api/server/backups/restore",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          serverId: currentServer.id,
          backupId
        })
      }
    );
  }

  if (
    event.target.classList.contains(
      "delete-backup"
    )
  ) {
    if (
      !confirm(
        "¿Eliminar este backup?"
      )
    ) {
      return;
    }

    await fetch(
      "/api/server/backups/delete",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json"
        },
        body: JSON.stringify({
          serverId: currentServer.id,
          backupId
        })
      }
    );

    await loadBackups();
  }
}
async function ensureBackupPathConfigured() {
  const pathElement = document.getElementById("backup-path");

  let backupPath = pathElement.textContent.trim();

  if (backupPath === "No configurada") {
    backupPath = "";
  }

  if (backupPath !== "") {
    return true;
  }

  const newPath = prompt(
    "Configura una ruta para guardar los backups:"
  );

  if (!newPath || newPath.trim() === "") {
    alert("No se ha configurado ninguna ruta.");
    return false;
  }

  const valid = await testBackupPath(newPath);

  if (!valid) {
    alert("La ruta no es válida o no tiene permisos de escritura.");
    return false;
  }

async function saveConfig(extra = {}) {
  try {
    const response = await fetch(
      "/api/server/backups/config/save",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          serverId: currentServer.id,

          backupPath:
            extra.backupPath ??
            document.getElementById("backup-path").textContent,

          automaticBackups:
            document.getElementById("automatic-backups").checked,

          backupOnStart:
            document.getElementById("backup-on-start").checked,

          automaticIntervalMinutes:
            Number(document.getElementById("backup-interval").value),

          maxAutomaticBackups:
            Number(document.getElementById("backup-limit").value)
        })
      }
    );

    const data = await response.json();

    if (!data.success) {
      alert(data.error || "Error guardando configuración de backups");
      return false;
    }

    await loadBackupConfig();

    return true;

  } catch (error) {
    console.error(error);
    alert("Error conectando con el servidor");
    return false;
  }
}

  return true;
}
async function testBackupPath(backupPath) {
  const response = await fetch(
    "/api/server/backups/test-path",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        backupPath
      })
    }
  );

  const data = await response.json();

  return data.success;
}
function formatDate(date) {
  return new Date(date)
    .toLocaleString("es-ES");
}