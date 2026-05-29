const { WebSocketServer } = require("ws");

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", socket => {
    console.log("Cliente WebSocket conectado");

    socket.send(JSON.stringify({
      type: "console",
      data: "Conectado a la consola"
    }));

    socket.on("close", () => {
      console.log("Cliente WebSocket desconectado");
    });
  });
}

function broadcastConsole(data) {
  if (!wss) return;

  const payload = JSON.stringify({
    type: "console",
    data: String(data)
  });

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(payload);
    }
  });
}

module.exports = {
  setupWebSocket,
  broadcastConsole
};