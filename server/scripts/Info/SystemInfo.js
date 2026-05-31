const os = require("os");
const fs = require("fs");

function getLocalIp() {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (
        net.family === "IPv4" &&
        !net.internal
      ) {
        return net.address;
      }
    }
  }

  return "localhost";
}

function getCpuTemperature() {
  const thermalPath =
    "/sys/class/thermal/thermal_zone0/temp";

  try {
    if (!fs.existsSync(thermalPath)) {
      return null;
    }

    const raw = fs.readFileSync(
      thermalPath,
      "utf8"
    );

    const value = Number(raw.trim());

    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.round(value / 100) / 10;
  } catch {
    return null;
  }
}

function getSystemInfo() {
  const totalRam = os.totalmem();
  const freeRam = os.freemem();
  const usedRam = totalRam - freeRam;

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),

    cpu: os.cpus()?.[0]?.model || "Desconocido",
    cpuCores: os.cpus().length,

    ram: {
      total: totalRam,
      free: freeRam,
      used: usedRam,
      usedPercent: Math.round(
        (usedRam / totalRam) * 100
      )
    },

    uptime: os.uptime(),

    ip: getLocalIp(),

    temperature: getCpuTemperature()
  };
}

module.exports = {
  getLocalIp,
  getCpuTemperature,
  getSystemInfo
};