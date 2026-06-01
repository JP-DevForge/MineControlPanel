const express = require("express");
const path = require("path");

const routes = require("./routes/routes");
const setupSpaRoutes = require("./routes/spaRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend estático
app.use("/css", express.static(
  path.join(__dirname, "../client/css")
));

app.use("/js", express.static(
  path.join(__dirname, "../client/js")
));

app.use("/sections", express.static(
  path.join(__dirname, "../client/sections")
));

app.use("/img", express.static(
  path.join(__dirname, "../client/img")
));

// API
app.use(routes);

// SPA
setupSpaRoutes(
  app,
  path.join(__dirname, "../client")
);

// 404
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

module.exports = app;