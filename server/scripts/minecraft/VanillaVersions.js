const fs = require("fs");
const path = require("path");

const MANIFEST_URL =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

async function getVanillaVersions() {
  const response = await fetch(MANIFEST_URL);
  if (!response.ok) {
    throw new Error("No se pudo obtener la lista de versiones de Mojang");
  }

  const manifest = await response.json();

  return manifest.versions
    .filter(version => version.type === "release")
    .map(version => ({
      id: version.id,
      url: version.url,
      releaseTime: version.releaseTime
    }));
}

async function getVanillaServerJarUrl(versionId) {
  const versions = await getVanillaVersions();
  const version = versions.find(item => item.id === versionId);

  if (!version) {
    throw new Error("Versión de Minecraft no encontrada");
  }

  const response = await fetch(version.url);

  if (!response.ok) {
    throw new Error("No se pudo obtener la información de la versión");
  }

  const data = await response.json();
  const jarUrl = data.downloads?.server?.url;

  if (!jarUrl) {
    throw new Error("Esta versión no tiene server.jar oficial");
  }

  return jarUrl;
}

async function downloadVanillaServerJar(versionId, serverPath) {
  if (!serverPath || serverPath.trim() === "" || serverPath.trim() === "/") {
    throw new Error("Ruta del servidor no válida");
  }

  const resolvedServerPath = path.resolve(serverPath);
  const jarUrl = await getVanillaServerJarUrl(versionId);

  if (!fs.existsSync(resolvedServerPath)) {
    fs.mkdirSync(resolvedServerPath, { recursive: true });
  }

  const response = await fetch(jarUrl);

  if (!response.ok) {
    throw new Error("No se pudo descargar server.jar");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const jarPath = path.join(resolvedServerPath, "server.jar");

  fs.writeFileSync(jarPath, buffer);

  return {
    jar: "server.jar",
    path: jarPath
  };
}

module.exports = {
  getVanillaVersions,
  getVanillaServerJarUrl,
  downloadVanillaServerJar
};