const fs = require("fs");
const path = require("path");

const { ensureDir } = require("./BackupUtils");

function getBackupDataDir(server) {
  return path.join(server.path, "minecontrol-data", "backups");
}

function getConfigFile(server) {
  return path.join(getBackupDataDir(server), "backups.json");
}

function getDefaultConfig() {
  return {
    backupPath: "",
    backupOnStart: false,
    automaticBackups: false,
    automaticIntervalMinutes: 60,
    maxAutomaticBackups: 10
  };
}

function ensureConfigFile(server) {
  const dir = getBackupDataDir(server);
  const file = getConfigFile(server);

  ensureDir(dir);

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(getDefaultConfig(), null, 2),
      "utf8"
    );
  }
}

function getConfig(server) {
  ensureConfigFile(server);

  try {
    return {
      ...getDefaultConfig(),
      ...JSON.parse(fs.readFileSync(getConfigFile(server), "utf8"))
    };
  } catch {
    return getDefaultConfig();
  }
}

function saveConfig(server, config) {
  ensureConfigFile(server);

  const finalConfig = {
    ...getDefaultConfig(),
    ...config
  };

  fs.writeFileSync(
    getConfigFile(server),
    JSON.stringify(finalConfig, null, 2),
    "utf8"
  );

  return finalConfig;
}

function getBackupDir(server) {
  const config = getConfig(server);

  if (config.backupPath && config.backupPath.trim() !== "") {
    return config.backupPath;
  }

  return getBackupDataDir(server);
}
function testBackupPath(backupPath) {
  if (!backupPath || backupPath.trim() === "") {
    throw new Error("Ruta de backups no configurada");
  }

  if (!path.isAbsolute(backupPath)) {
    throw new Error("La ruta debe ser absoluta");
  }

  ensureDir(backupPath);

  const testFile = path.join(
    backupPath,
    ".minecontrol-write-test"
  );

  fs.writeFileSync(testFile, "test", "utf8");
  fs.unlinkSync(testFile);

  return true;
}
module.exports = {
  getBackupDataDir,
  getConfig,
  saveConfig,
  getBackupDir,
  testBackupPath
};