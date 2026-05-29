const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");

const { validateServer } = require("./BackupUtils");
const { getBackupDir } = require("./BackupConfig");

async function restoreBackup(server, backupId) {
  validateServer(server);

  const backupPath = path.join(
    getBackupDir(server),
    backupId
  );

  if (!fs.existsSync(backupPath)) {
    throw new Error("El archivo del backup no existe");
  }

  fs.rmSync(server.path, {
    recursive: true,
    force: true
  });

  fs.mkdirSync(server.path, {
    recursive: true
  });

  await fs
    .createReadStream(backupPath)
    .pipe(
      unzipper.Extract({
        path: server.path
      })
    )
    .promise();

  return true;
}

function deleteBackup(server, backupId) {
  validateServer(server);

  const backupPath = path.join(
    getBackupDir(server),
    backupId
  );

  if (!fs.existsSync(backupPath)) {
    throw new Error("Backup no encontrado");
  }

  fs.unlinkSync(backupPath);

  return true;
}

module.exports = {
  restoreBackup,
  deleteBackup
};