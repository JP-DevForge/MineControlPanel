const http = require("http");

const app = require("./server/app");
const { setupWebSocket } = require("./server/websocket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`MineControlPanel iniciado en http://localhost:${PORT}`);
});