import { renderHome } from "./ventana.js";
import { connectServer } from "./botones.js";
export async function initCreateServer() {
    console.log("Inicializando pantalla de creación de servidor...");
  const backButton = document.getElementById("back-home");
  const form = document.getElementById("create-server-form");

  const typeSelect = document.getElementById("server-create-type");
  const vanillaBox = document.getElementById("vanilla-version-box");
  const vanillaSelect = document.getElementById("vanilla-version");

  const customJarBox = document.getElementById("custom-jar-box");
  const customJarInput = document.getElementById("custom-jar");

  const message = document.getElementById("create-server-message");

  backButton.addEventListener("click", renderHome);

  typeSelect.addEventListener("change", () => {
    const type = typeSelect.value;

    if (type === "vanilla") {
      vanillaBox.classList.remove("hidden");
      customJarBox.classList.add("hidden");

      vanillaSelect.required = true;
      customJarInput.required = false;
    } else {
      vanillaBox.classList.add("hidden");
      customJarBox.classList.remove("hidden");

      vanillaSelect.required = false;
      customJarInput.required = true;
    }
  });

  await loadVanillaVersions(vanillaSelect, message);

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const type = typeSelect.value;

    if (type === "vanilla") {
      await createVanillaServer(message);
      return;
    }

    await createCustomServer(message);
  });
}

async function loadVanillaVersions(select, message) {
  try {
    console.log("Cargando versiones Vanilla...");

    const response = await fetch("/api/vanilla/versions");
    console.log("Respuesta:", response.status);

    const data = await response.json();
    console.log("Datos versiones:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.error || "No se pudieron cargar las versiones");
    }

    select.innerHTML = "";

    data.versions.forEach(version => {
      const option = document.createElement("option");

      option.value = version.id;
      option.textContent = version.id;

      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error cargando versiones:", error);

    select.innerHTML = `
      <option value="">Error cargando versiones</option>
    `;

    message.textContent = error.message;
  }
}

async function createVanillaServer(message) {
  const name = document.getElementById("server-name").value.trim();
  const serverPath = document.getElementById("server-path").value.trim();
  const version = document.getElementById("vanilla-version").value;
  const port = Number(document.getElementById("server-port").value);

  setCreateServerStatus(message, "Preparando creación del servidor...");

  try {
    setCreateServerStatus(message, "Descargando server.jar...");

    const response = await fetch("/api/servers/create/vanilla", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        path: serverPath,
        version,
        port
      })
    });

    setCreateServerStatus(message, "Procesando respuesta del servidor...");

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "No se pudo crear el servidor");
    }

    setCreateServerStatus(
      message,
      "Servidor Vanilla creado correctamente"
    );

  } catch (error) {
    console.error(error);
    setCreateServerStatus(message, error.message);
  }
}


async function createCustomServer(message) {
  const name = document.getElementById("server-name").value.trim();
  const serverPath = document.getElementById("server-path").value.trim();
  const port = Number(document.getElementById("server-port").value);
  const jarFile = document.getElementById("custom-jar").files[0];

  if (!jarFile) {
    message.textContent = "Selecciona un archivo .jar";
    return;
  }

  const formData = new FormData();

  formData.append("name", name);
  formData.append("path", serverPath);
  formData.append("port", port);
  formData.append("jar", jarFile);

  message.textContent = "Creando servidor...";

  try {
    const response = await fetch("/api/servers/create/custom", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Error creando servidor");
    }

    message.textContent = "Servidor creado correctamente";

    await connectServer(data.server.id);

  } catch (error) {
    console.error(error);
    message.textContent = error.message;
  }
}
function setCreateServerStatus(messageElement, text) {
  messageElement.textContent = text;
}