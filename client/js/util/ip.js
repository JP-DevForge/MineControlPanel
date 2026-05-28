function ip() {
  const express = require("express");
  const app = express();

  app.get("/", (req, res) => {
    const ip = req.ip;
  });
}
const ipnum = document.getElementById("ip");
const boton = document.getElementById("copiar");

boton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(ipnum.textContent);
});