const fs = require("fs");
const path = require("path");

const { getBackupDir } = require("./BackupConfig");

function parseBackupFileName(fileName) {
  const clean = fileName.replace(".zip", "");

  const match = clean.match(
    /^backup_(.+)_(\d{4}-\d{2}-\d{2})_(\d{2}-\d{2}-\d{2})$/
  );

  if (!match) {
    return {
      reason: "unknown",
      createdAt: null
    };
  }

  const reason = match[1];
  const date = match[2];
  const time = match[3].replace(/-/g, ":");

  return {
    reason,
    createdAt: `${date}T${time}`
  };
}

function listBackups(server) {
  const backupDir = getBackupDir(server);

  if (!fs.existsSync(backupDir)) {
    return [];
  }

  return fs
    .readdirSync(backupDir)
    .filter(file => file.endsWith(".zip"))
    .filter(file => file.startsWith("backup_"))
    .map(file => {
      const fullPath = path.join(backupDir, file);
      const stats = fs.statSync(fullPath);
      const parsed = parseBackupFileName(file);

      return {
        id: file,
        reason: parsed.reason,
        fileName: file,
        path: fullPath,
        size: stats.size,
        createdAt: parsed.createdAt || stats.birthtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

module.exports = {
  listBackups,
  parseBackupFileName
};