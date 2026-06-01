console.log("worlds.js cargado");

function getActiveServerId() {
    const params = new URLSearchParams(window.location.search);
    const serverId = params.get("serverId");

    if (serverId) return serverId;

    const raw = sessionStorage.getItem("mcp_active_server");

    if (!raw) {
        throw new Error("No hay servidor activo");
    }

    return JSON.parse(raw).id;
}

function setWorldsMessage(message) {
    const worldsList = document.getElementById("worldsList");

    if (!worldsList) return;

    worldsList.innerHTML = `<p class="texto">${message}</p>`;
}

function formatDate(dateValue) {
    if (!dateValue) return "Desconocida";

    return new Date(dateValue).toLocaleString("es-ES");
}

function renderWorlds(data) {
    const activeWorldText = document.getElementById("activeWorldText");
    const worldsList = document.getElementById("worldsList");

    if (!worldsList) return;

    const worlds = data.worlds || [];
    const activeWorld = data.activeWorld || "world";

    if (activeWorldText) {
        activeWorldText.textContent = `Mundo activo: ${activeWorld}`;
    }

    if (worlds.length === 0) {
        setWorldsMessage("No se han encontrado mundos");
        return;
    }

    worldsList.innerHTML = "";

    for (const world of worlds) {
        const worldCard = document.createElement("article");
        worldCard.className = "world-card";

        if (world.active) {
            worldCard.classList.add("active");
        }

        worldCard.innerHTML = `
            <div class="world-info">
                <h3>${world.name || world.folder}</h3>

                <p class="texto">Carpeta: ${world.folder}</p>
                <p class="texto">Tamaño: ${world.sizeFormatted || "0 B"}</p>
                <p class="texto">Última modificación: ${formatDate(world.lastModifiedAt)}</p>
            </div>
<div class="world-actions">
  ${
    world.active
      ? `<span class="active-world">Activo</span>`
      : `<button class="select-world-btn" data-folder="${world.folder}">
          Seleccionar
        </button>`
  }

  <button
    class="delete-world-btn"
    data-folder="${world.folder}">
    Borrar
  </button>
</div>
        `;

        worldsList.appendChild(worldCard);
    }

    bindSelectWorldButtons();
    bindDeleteWorldButtons();
}

async function loadWorlds() {
    try {
        setWorldsMessage("Cargando mundos...");

        const serverId = getActiveServerId();

        const response = await fetch(`/api/servers/${serverId}/worlds`);
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Error cargando mundos");
        }

        renderWorlds(result.data);

    } catch (error) {
        console.error(error);
        setWorldsMessage(error.message || "Error cargando mundos");
    }
}

function bindSelectWorldButtons() {
  document.querySelectorAll(".select-world-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const folder = button.dataset.folder;

      await selectWorld(folder);
    });
  });
}



async function selectWorld(folder) {
    try {
        const serverId = getActiveServerId();

        const response = await fetch(`/api/servers/${serverId}/worlds/select`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ folder })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.error || "Error seleccionando mundo");
        }

        await loadWorlds();

    } catch (error) {
        console.error(error);
        alert(error.message || "Error seleccionando mundo");
    }
}

async function createWorld() {
    const name = prompt("Nombre del nuevo mundo:");

    if (!name) {
        return;
    }

    try {
        const serverId = getActiveServerId();

        const response = await fetch(
            `/api/servers/${serverId}/worlds/create`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Error creando mundo"
            );
        }

        await loadWorlds();

    } catch (error) {
        console.error(error);

        alert(
            error.message || "Error creando mundo"
        );
    }
}

export function initWorlds() {
    const refreshButton =
        document.getElementById("refreshWorldsBtn");

    const createButton =
        document.getElementById("createWorldBtn");

    if (refreshButton) {
        refreshButton.onclick = loadWorlds;
    }

    if (createButton) {
        createButton.onclick = createWorld;
    }

    loadWorlds();
}
function bindDeleteWorldButtons() {
    document.querySelectorAll(".delete-world-btn").forEach(button => {
        button.onclick = async () => {
            const folder = button.dataset.folder;

            const confirmed = confirm(
                `¿Borrar el mundo "${folder}"?`
            );

            if (!confirmed) {
                return;
            }

            await deleteWorld(folder);
        };
    });
}

async function deleteWorld(folder) {
    try {
        const serverId = getActiveServerId();

        const response = await fetch(
            `/api/servers/${serverId}/worlds/delete`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    folder
                })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || "Error borrando mundo"
            );
        }

        await loadWorlds();

    } catch (error) {
        console.error(error);

        alert(
            error.message || "Error borrando mundo"
        );
    }
}