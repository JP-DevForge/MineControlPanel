const fs = require("fs");
const path = require("path");

function getConsoleHistoryFile(serverPath) {
  return path.join(
    serverPath,
    "minecontrol-data",
    "console-hystory.txt"
  );
}

function ensureConsoleHistoryFile(serverPath) {
  const file = getConsoleHistoryFile(serverPath);
  const dir = path.dirname(file);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "", "utf8");
  }

  return file;
}

function appendConsoleLine(serverPath, line) {
  const file = ensureConsoleHistoryFile(serverPath);

  fs.appendFileSync(
    file,
    line + "\n",
    "utf8"
  );
}

function getConsoleHistory(serverPath) {
  const file = ensureConsoleHistoryFile(serverPath);

  return fs.readFileSync(file, "utf8");
}

function clearConsoleHistory(serverPath) {
  const file = ensureConsoleHistoryFile(serverPath);

  fs.writeFileSync(file, "", "utf8");
}

module.exports = {
  appendConsoleLine,
  getConsoleHistory,
  clearConsoleHistory
};