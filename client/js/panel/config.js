const SELECT_OPTIONS = {
    gamemode: [
        ["survival", "Supervivencia"],
        ["creative", "Creativo"],
        ["adventure", "Aventura"],
        ["spectator", "Espectador"]
    ],

    difficulty: [
        ["peaceful", "Pacífico"],
        ["easy", "Fácil"],
        ["normal", "Normal"],
        ["hard", "Difícil"]
    ]
};

const LABELS = {
    gamemode: "Modo de juego",
    difficulty: "Dificultad",
    motd: "Mensaje",
    "max-players": "Jugadores máximos",
    "online-mode": "Modo online",
    "white-list": "Whitelist",
    "enforce-whitelist": "Forzar whitelist",
    "player-idle-timeout": "Expulsar inactivos",
    pvp: "PVP",
    "allow-flight": "Permitir volar",
    "enable-command-block": "Bloques de comandos",
    hardcore: "Hardcore",
    "force-gamemode": "Forzar modo",
    "spawn-protection": "Protección spawn",
    "level-name": "Nombre del mundo",
    "level-seed": "Seed",
    "level-type": "Tipo de mundo",
    "generate-structures": "Generar estructuras",
    "allow-nether": "Permitir Nether",
    "spawn-monsters": "Spawnear monstruos",
    "spawn-animals": "Spawnear animales",
    "spawn-npcs": "Spawnear NPCs",
    "view-distance": "Distancia render",
    "simulation-distance": "Distancia simulación",
    "max-tick-time": "Tiempo máximo tick",
    "entity-broadcast-range-percentage": "Rango entidades",
    "network-compression-threshold": "Compresión red",
    "server-ip": "IP del servidor",
    "server-port": "Puerto",
    "enable-query": "Activar query",
    "query.port": "Puerto query",
    "enable-rcon": "Activar RCON",
    "rcon.port": "Puerto RCON",
    "rcon.password": "Contraseña RCON",
    "prevent-proxy-connections": "Evitar proxy",
    "enforce-secure-profile": "Perfil seguro",
    "hide-online-players": "Ocultar jugadores",
    "broadcast-console-to-ops": "Consola a OPs",
    "broadcast-rcon-to-ops": "RCON a OPs"
};

const CONFIG_GROUPS = {
  General: [
    "motd",
    "gamemode",
    "difficulty",
    "hardcore",
    "force-gamemode"
  ],

  Jugadores: [
    "max-players",
    "online-mode",
    "white-list",
    "enforce-whitelist",
    "player-idle-timeout",
    "hide-online-players"
  ],

  Gameplay: [
    "pvp",
    "allow-flight",
    "enable-command-block",
    "spawn-protection"
  ],

  Mundo: [
    "level-name",
    "level-seed",
    "level-type",
    "generate-structures",
    "allow-nether",
    "spawn-monsters",
    "spawn-animals",
    "spawn-npcs"
  ],

  Rendimiento: [
    "view-distance",
    "simulation-distance",
    "max-tick-time",
    "entity-broadcast-range-percentage",
    "network-compression-threshold"
  ],

  Red: [
    "server-ip",
    "server-port",
    "enable-query",
    "query.port",
    "enable-rcon",
    "rcon.port",
    "rcon.password"
  ],

  Seguridad: [
    "prevent-proxy-connections",
    "enforce-secure-profile",
    "broadcast-console-to-ops",
    "broadcast-rcon-to-ops"
  ],

  Avanzado: [
    "enable-jmx-monitoring",
    "sync-chunk-writes",
    "use-native-transport",
    "rate-limit",
    "op-permission-level",
    "function-permission-level",
    "text-filtering-config",
    "resource-pack",
    "resource-pack-sha1",
    "require-resource-pack"
  ]
};

let currentProperties = {};

export async function renderConfig(server) {
    const container = document.getElementById("config-options");
    const saveButton = document.getElementById("save-config");

    if (!container || !saveButton) {
        console.error("No existen config-options o save-config");
        return;
    }

    container.innerHTML = `<p class="empty-message">Leyendo server.properties...</p>`;

    try {
        const response = await fetch("/api/server/properties", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ server })
        });

        const data = await response.json();

        if (!data.success) {
            container.innerHTML = `<p class="empty-message">${data.error}</p>`;
            return;
        }

        currentProperties = data.properties;
        renderGroupedOptions(container, currentProperties);
        initConfigAnimations();

        saveButton.onclick = () => saveConfig(server);

    } catch (error) {
        console.error("Error cargando configuración:", error);
        container.innerHTML = `<p class="empty-message">Error cargando server.properties</p>`;
    }
}
function renderGroupedOptions(container, properties) {
    container.innerHTML = "";

    const usedKeys = new Set();

    Object.entries(CONFIG_GROUPS).forEach(([groupName, keys]) => {
        const grid = document.createElement("div");
        grid.className = "options-grid";

        keys.forEach(key => {
            if (!(key in properties)) return;

            usedKeys.add(key);
            grid.appendChild(createOption(key, properties[key]));
        });

        if (grid.children.length > 0) {
            container.appendChild(
                createConfigGroup(groupName, grid, grid.children.length)
            );
        }
    });

    const unknownGrid = document.createElement("div");
    unknownGrid.className = "options-grid";

    Object.entries(properties).forEach(([key, value]) => {
        if (usedKeys.has(key)) return;

        unknownGrid.appendChild(createOption(key, value));
    });

    if (unknownGrid.children.length > 0) {
        container.appendChild(
            createConfigGroup("Desconocido", unknownGrid, unknownGrid.children.length)
        );
    }
}

function createConfigGroup(groupName, grid, totalOptions) {
    const group = document.createElement("details");
    group.className = "config-group";

    if (totalOptions < 10) {
        group.open = true;
    }

    const summary = document.createElement("summary");
    summary.innerHTML = `
    <span>${groupName}</span>
    <span class="config-count">${totalOptions}</span>
  `;

    group.appendChild(summary);
    group.appendChild(grid);

    return group;
}

function createOption(key, value) {
    const div = document.createElement("div");
    div.className = "option";

    const label = document.createElement("p");
    label.textContent = LABELS[key] || key;

    div.appendChild(label);
    div.appendChild(createInput(key, value));

    return div;
}

function createInput(key, value) {
    if (SELECT_OPTIONS[key]) {
        const select = document.createElement("select");
        select.dataset.key = key;

        SELECT_OPTIONS[key].forEach(([realValue, text]) => {
            const option = document.createElement("option");
            option.value = realValue;
            option.textContent = text;
            option.selected = realValue === value;

            select.appendChild(option);
        });

        return select;
    }

    if (typeof value === "boolean") {
        const label = document.createElement("label");
        label.className = "switch";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = value;
        checkbox.dataset.key = key;

        const slider = document.createElement("span");
        slider.className = "slider";

        label.appendChild(checkbox);
        label.appendChild(slider);

        return label;
    }

    const input = document.createElement("input");
    input.dataset.key = key;

    if (typeof value === "number") {
        input.type = "number";
        input.className = "number";
    } else {
        input.type = "text";
    }

    input.value = value;

    return input;
}

async function saveConfig(server) {
    const inputs = document.querySelectorAll("[data-key]");
    const properties = { ...currentProperties };

    inputs.forEach(input => {
        const key = input.dataset.key;

        if (input.type === "checkbox") {
            properties[key] = input.checked;
        } else if (input.type === "number") {
            properties[key] = Number(input.value);
        } else {
            properties[key] = input.value;
        }
    });

    const response = await fetch("/api/server/properties/save", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            server,
            properties
        })
    });

    const data = await response.json();

    if (!data.success) {
        alert(data.error || "Error guardando configuración");
        return;
    }

    alert("Configuración guardada");
}
function initConfigAnimations() {
    document.querySelectorAll(".config-group").forEach(details => {
        const summary = details.querySelector("summary");
        const content = details.querySelector(".options-grid");

        if (!summary || !content) return;

        if (details.open) {
            content.style.height = "auto";
            content.style.opacity = "1";
        } else {
            content.style.height = "0px";
            content.style.opacity = "0";
        }

        summary.addEventListener("click", e => {
            e.preventDefault();

            if (details.open) {
                content.style.height = content.scrollHeight + "px";

                requestAnimationFrame(() => {
                    content.style.height = "0px";
                    content.style.opacity = "0";
                });

                content.addEventListener("transitionend", () => {
                    details.open = false;
                }, { once: true });

                return;
            }

            details.open = true;

            content.style.height = "0px";
            content.style.opacity = "0";

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    content.style.height = content.scrollHeight + "px";
                    content.style.opacity = "1";
                });
            });

            content.addEventListener("transitionend", () => {
                content.style.height = "auto";
            }, { once: true });
        });
    });
}