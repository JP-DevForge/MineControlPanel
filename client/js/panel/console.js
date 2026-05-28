let socket = null;

window.iniciarConsole = function iniciarConsole() {
  const output = document.getElementById("console-output");
  const input = document.getElementById("console-input");
  const sendButton = document.getElementById("console-send");

  if (!output || !input || !sendButton) {
    console.error("Faltan elementos de la consola");
    return;
  }

  connectConsole(output);

  sendButton.onclick = () => {
    sendConsoleCommand(output, input);
  };

  input.onkeydown = event => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendConsoleCommand(output, input);
    }
  };
};

function connectConsole(output) {
  if (
    socket &&
    socket.readyState !== WebSocket.CLOSED &&
    socket.readyState !== WebSocket.CLOSING
  ) {
    return;
  }

  socket = new WebSocket(`ws://${location.host}`);

  socket.onopen = () => {
    output.innerHTML += `<div>Conectado a la consola.</div>`;
  };

  socket.onmessage = event => {
    const message = JSON.parse(event.data);

    if (message.type !== "console") {
      return;
    }

    output.innerHTML += `<div>${message.data}</div>`;
    output.scrollTop = output.scrollHeight;
  };

  socket.onerror = () => {
    output.innerHTML += `<div>Error conectando con WebSocket.</div>`;
  };

  socket.onclose = () => {
    output.innerHTML += `<div>Conexión WebSocket cerrada.</div>`;
  };
}

function sendConsoleCommand(output, input) {
  const command = input.value.trim();

  if (!command) {
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    output.innerHTML += `<div>No hay conexión con la consola.</div>`;
    input.value = "";
    return;
  }

  socket.send(JSON.stringify({
    type: "command",
    command
  }));

  input.value = "";
}