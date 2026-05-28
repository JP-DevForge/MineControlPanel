const { spawn } = require("child_process");
const AnsiToHtml = require("ansi-to-html");

const convert = new AnsiToHtml();
const websocket = require("../websocket");
const {
    appendConsoleLine,
    getConsoleHistory
} = require('./syncjson/ConsoleHistoryJSON');
let mcServer = null;
let mcRunning = false;

function startServer(server) {

    if (mcRunning) {
        throw new Error("El servidor ya está iniciado");
    }

    if (!server || !server.path || !server.jar) {
        throw new Error("Faltan path o jar del servidor");
    }

    mcServer = spawn("java", ["-jar", server.jar], {
        cwd: server.path
    });

    mcRunning = true;

    websocket.broadcastConsole(`Arrancando servidor: ${server.name}\n`);

    mcServer.stdout.on("data", data => {
        const raw = data.toString();
        const html = convert.toHtml(raw);

        websocket.broadcastConsole(html);
    });

    mcServer.stderr.on("data", data => {
        const raw = data.toString();
        const html = convert.toHtml(raw);

        websocket.broadcastConsole(html);
    });

    mcServer.on("error", error => {
        websocket.broadcastConsole(
            `Error al iniciar el servidor: ${error.message}\n`
        );

        mcRunning = false;
        mcServer = null;
    });

    mcServer.on("close", code => {
        websocket.broadcastConsole(
            `Servidor detenido con código ${code}\n`
        );

        mcRunning = false;
        mcServer = null;
    });
}

function stopServer() {
    if (!mcRunning || !mcServer) {
        throw new Error("El servidor no está iniciado");
    }

    mcServer.stdin.write("stop\n");
    websocket.broadcastConsole("> stop\n");
}

function restartServer(server) {
    stopServer();

    setTimeout(() => {
        startServer(server);
    }, 3000);
}

function sendCommand(command) {
    if (!mcRunning || !mcServer) {
        throw new Error("El servidor no está iniciado");
    }

    mcServer.stdin.write(command + "\n");
    websocket.broadcastConsole(`> ${command}\n`);
}

function isRunning() {
    return mcRunning;
}

module.exports = {
    startServer,
    stopServer,
    restartServer,
    sendCommand,
    isRunning
};