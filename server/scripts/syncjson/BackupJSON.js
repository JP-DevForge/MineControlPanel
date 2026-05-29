const fs = require("fs");
const path = require("path");

function getBackupDataDir(server) {
  return path.join(server.path, "minecontrol-data", "backups");
}

function getBackupConfigFile(server) {
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

function ensureBackupConfig(server) {
  const dir = getBackupDataDir(server);
  const file = getBackupConfigFile(server);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      JSON.stringify(getDefaultConfig(), null, 2),
      "utf8"
    );
  }
}

function getConfig(server) {
  ensureBackupConfig(server);

  try {
    return {
      ...getDefaultConfig(),
      ...JSON.parse(fs.readFileSync(getBackupConfigFile(server), "utf8"))
    };
  } catch {
    return getDefaultConfig();
  }
}

function saveConfig(server, config) {
  ensureBackupConfig(server);

  const finalConfig = {
    ...getDefaultConfig(),
    ...config
  };

  fs.writeFileSync(
    getBackupConfigFile(server),
    JSON.stringify(finalConfig, null, 2),
    "utf8"
  );

  return finalConfig;
}

module.exports = {
  getBackupDataDir,
  getConfig,
  saveConfig
};