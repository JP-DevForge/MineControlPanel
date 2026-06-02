import { loadSection } from "./index/selection.js";
import { renderHome } from "./index/ventana.js";

let authMode = "login";

async function checkConfigured() {
  const res = await fetch("/api/auth/status");
  const data = await res.json();

  return data.configured;
}

async function checkSession() {
  const res = await fetch("/api/servers");

  return res.ok;
}

async function sendPassword(password) {
  const url =
    authMode === "setup"
      ? "/api/auth/setup"
      : "/api/auth/login";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password })
  });

  return res.json();
}

async function renderAuth() {
  const loaded = await loadSection("selector", "auth");

  if (!loaded) {
    console.error("No se pudo cargar la sección auth");
    return;
  }

  const description = document.getElementById("auth-description");
  const form = document.getElementById("auth-form");
  const passwordInput = document.getElementById("auth-password");
  const message = document.getElementById("auth-message");

  if (!form || !passwordInput || !message) {
    console.error("Faltan elementos en auth.html");
    return;
  }

  if (authMode === "setup") {
    description.textContent =
      "Primera configuración. Crea la contraseña de acceso al panel.";
  } else {
    description.textContent =
      "Introduce la contraseña para acceder al panel.";
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const password = passwordInput.value.trim();

    if (!password) {
      message.textContent = "Introduce una contraseña";
      return;
    }

    const data = await sendPassword(password);

    if (!data.success) {
      message.textContent = data.error || "Contraseña incorrecta";
      return;
    }

    await renderHome();
  });
}

export async function initAuth() {
  const configured = await checkConfigured();

  if (!configured) {
    authMode = "setup";
    await renderAuth();
    return;
  }

  const sessionValid = await checkSession();

  if (sessionValid) {
    await renderHome();
    return;
  }

  authMode = "login";
  await renderAuth();
}
export async function logout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    console.error(error);
  }

  location.reload();
}