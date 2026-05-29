let consoleInterval = null;

window.iniciarConsole = function iniciarConsole() {
  const output = document.getElementById("console-output");
  const input = document.getElementById("console-input");
  const sendButton = document.getElementById("console-send");

  if (!output || !input || !sendButton) {
    console.error("Faltan elementos de la consola");
    return;
  }

  const activeServerRaw = sessionStorage.getItem("mcp_active_server");

  if (!activeServerRaw) {
    output.textContent = "No hay servidor seleccionado.";
    return;
  }

  const selectedServer = JSON.parse(activeServerRaw);

  async function loadConsole() {
    const response = await fetch(
      `/api/server/console?id=${selectedServer.id}`
    );

    const data = await response.json();

    if (!data.success) {
      output.textContent = data.error;
      return;
    }

    output.textContent = data.log;
    output.scrollTop = output.scrollHeight;
  }

  async function sendCommand() {
    const command = input.value.trim();

    if (!command) {
      return;
    }

    const response = await fetch("/api/server/command", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: selectedServer.id,
        command
      })
    });

    const data = await response.json();

    if (!data.success) {
      output.textContent += `\n[MineControlPanel] ${data.error}`;
    }

    input.value = "";

    setTimeout(loadConsole, 300);
  }

  sendButton.onclick = sendCommand;

  input.onkeydown = event => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendCommand();
    }
  };

  if (consoleInterval) {
    clearInterval(consoleInterval);
  }

  loadConsole();
  consoleInterval = setInterval(loadConsole, 1000);
};