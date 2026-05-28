const path = require("path");

const indexRoutes = [
  "/"
];

const panelRoutes = [
  "/panel"
];

function setupSpaRoutes(app, rootDir) {

  // INDEX
  indexRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(
        path.join(rootDir, "index.html")
      );
    });
  });

  // PANEL
  panelRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(
        path.join(rootDir, "panel.html")
      );
    });
  });

  // SPA fallback
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(
      path.join(rootDir, "index.html")
    );
  });

}

module.exports = setupSpaRoutes;