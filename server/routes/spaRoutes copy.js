const path = require("path");

const indexRoutes = [
  "/"
];

const panelRoutes = [
  "/panel"
];

function setupSpaRoutes(app, rootDir) {

  indexRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(
        path.join(rootDir, "index.html")
      );
    });
  });

  panelRoutes.forEach(route => {
    app.get(route, (req, res) => {
      res.sendFile(
        path.join(rootDir, "panel.html")
      );
    });
  });

}

module.exports = setupSpaRoutes;