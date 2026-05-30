const net = require("net");

function writeVarInt(value) {
  const bytes = [];

  while (true) {
    if ((value & ~0x7F) === 0) {
      bytes.push(value);
      return Buffer.from(bytes);
    }

    bytes.push((value & 0x7F) | 0x80);
    value >>>= 7;
  }
}

function writeString(value) {
  const data = Buffer.from(value, "utf8");

  return Buffer.concat([
    writeVarInt(data.length),
    data
  ]);
}

function readVarInt(buffer, offset = 0) {
  let value = 0;
  let position = 0;
  let currentByte;

  do {
    currentByte = buffer[offset++];

    if (currentByte === undefined) {
      throw new Error("Buffer incompleto");
    }

    value |= (currentByte & 0x7F) << (position * 7);
    position++;

    if (position > 5) {
      throw new Error("VarInt demasiado grande");
    }
  } while ((currentByte & 0x80) === 0x80);

  return {
    value,
    size: position
  };
}

function isPortOpen(host, port, timeout = 1500) {
  return new Promise(resolve => {
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function pingMinecraftServer(host, port = 25565, timeout = 2000) {
  return new Promise(resolve => {
    const socket = new net.Socket();
    const start = Date.now();

    let responseBuffer = Buffer.alloc(0);
    let resolved = false;

    function finish(result) {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve(result);
    }

    socket.setTimeout(timeout);

    socket.on("connect", () => {
      const protocolVersion = writeVarInt(767);
      const serverAddress = writeString(host);

      const serverPort = Buffer.alloc(2);
      serverPort.writeUInt16BE(port);

      const nextState = writeVarInt(1);

      const handshakeData = Buffer.concat([
        writeVarInt(0),
        protocolVersion,
        serverAddress,
        serverPort,
        nextState
      ]);

      const handshakePacket = Buffer.concat([
        writeVarInt(handshakeData.length),
        handshakeData
      ]);

      const statusRequestData = writeVarInt(0);

      const statusRequestPacket = Buffer.concat([
        writeVarInt(statusRequestData.length),
        statusRequestData
      ]);

      socket.write(Buffer.concat([
        handshakePacket,
        statusRequestPacket
      ]));
    });

    socket.on("data", chunk => {
      responseBuffer = Buffer.concat([responseBuffer, chunk]);

      try {
        let offset = 0;

        const packetLength = readVarInt(responseBuffer, offset);
        offset += packetLength.size;

        if (responseBuffer.length < offset + packetLength.value) {
          return;
        }

        const packetId = readVarInt(responseBuffer, offset);
        offset += packetId.size;

        if (packetId.value !== 0) {
          return finish({
            online: false,
            reason: "invalid_packet"
          });
        }

        const jsonLength = readVarInt(responseBuffer, offset);
        offset += jsonLength.size;

        const json = responseBuffer
          .slice(offset, offset + jsonLength.value)
          .toString("utf8");

        const data = JSON.parse(json);

        finish({
          online: true,
          latency: Date.now() - start,
          version: data.version?.name || "Desconocida",
          protocol: data.version?.protocol || null,
          players: {
            online: data.players?.online ?? 0,
            max: data.players?.max ?? 0
          },
          motd: data.description || null
        });
      } catch {
        // paquete incompleto todavía
      }
    });

    socket.once("timeout", () => {
      finish({
        online: false,
        reason: "timeout"
      });
    });

    socket.once("error", () => {
      finish({
        online: false,
        reason: "connection_error"
      });
    });

    socket.once("close", () => {
      finish({
        online: false,
        reason: "closed"
      });
    });

    socket.connect(port, host);
  });
}

module.exports = {
  isPortOpen,
  pingMinecraftServer
};