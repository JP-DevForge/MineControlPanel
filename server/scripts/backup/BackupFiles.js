const fs = require("fs");
const path = require("path");
const { ZipArchive } = require("archiver");

const {
  ensureDir,
  validateServer,
  getTimestamp,
  sanitizeReason
} = require("./BackupUtils");

const {
  getBackupDir
} = require("./BackupConfig");

async function backup(server, reason = "manual") {
  validateServer(server);

  const backupDir = getBackupDir(server);
  ensureDir(backupDir);

  const timestamp = getTimestamp();
  const safeReason = sanitizeReason(reason);

  const fileName = `backup_${safeReason}_${timestamp}.zip`;
  const finalPath = path.join(backupDir, fileName);

  const output = fs.createWriteStream(finalPath);

  const archive = new ZipArchive({
    zlib: {
      level: 9
    }
  });

  const finished = new Promise((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);
  archive.directory(server.path, false);

  await archive.finalize();
  await finished;

  console.log(
    `[BACKUP] Creado correctamente: ${finalPath}`
  );

  return finalPath;
}

module.exports = {
  backup
};