require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const routes = require("./routes/routes");
const auth = require("./scripts/auth");
const setupSpaRoutes = require("./routes/spaRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Auth antes de la API
app.use(auth.requireAuth);

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