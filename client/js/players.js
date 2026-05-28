///////////////////////////////////////
//AJAX jugadores

//const syncPlayers = require("./syncPlayers");

///////////////////////////////////////
window.enviarDamage = function (player) {
  let cantidad = prompt("Cantidad de daño a " + player);
  cantidad = Number(cantidad); // Convertimos a número

  if (!isNaN(cantidad) && cantidad > 0) {
    mcCommand("damage " + player + " " + cantidad);
  } else {
    alert("Por favor, introduce un número válido");
  }
};
var btnDamage = '<button onclick="enviarDamage()">Dañar</button>';
function iniciarPlayers() {
  // Elementos del DOM
  var tbody = document.getElementById("tbody");
  var filterInput = document.getElementById("filter");
  var count = document.getElementById("count");

  // Datos
  var allPlayers = [];
  var filteredPlayers = [];
  var selectedId = null;

  // ---------------- Construir HTML detalle ----------------
  function buildDetailHtml(player) {

    var c = player.coordenadas || {};
    var posActual = "x=" + c.x + ", y=" + c.y + ", z=" + c.z;

    return (
      '<div class="kvs">' +

      '<div class="key">Jugador</div><div class="val">' + player.name + '</div>' +
      '<div class="key">Modo de Juego</div><div class="val">' + player.gamemode + '</div>' +
      '<div class="key">Rango</div><div class="val">' + player.rango + '</div>' +
      '<div class="key">Mundo</div><div class="val">' + player.mundo + '</div>' +

      '<div class="key">Vida</div><div class="val">' + player.vida +'/20' + btnDamage + '</div>' +
      '<div class="key">Comida</div><div class="val">' + player.comida + '/20</div>' +

      '<div class="key">Coordenadas actuales</div><div class="val">' + posActual + '</div>' +
      '</div>'
    );
  }

  // ---------------- Render tabla (con detalle en fila) ----------------

  function renderTable() {
    if (filteredPlayers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No hay resultados</td></tr>';
      return;
    }

    var html = "";

    for (var i = 0; i < filteredPlayers.length; i++) {

      var p = filteredPlayers[i];
      var selected = (p.id === selectedId);
      var selectedClass = selected ? "selected" : "";

      //      var c = p.coordenadas;
      //      var pos = "x=" + c.x + ", y=" + c.y + ", z=" + c.z;
      var btnmsg = '<button onclick="enviarMsg(\'' + p.name + '\')">Mensaje</button>';
      var btnkick = '<button onclick="enviarKick(\'' + p.name + '\')">Expulsar</button>';
      var btnBan = '<button onclick="enviarBan(\'' + p.name + '\')">Banear</button>';
      window.enviarMsg = function (player) {
        const texto = prompt("Mensaje para " + player);
        if (texto) {
          mcCommand("msg " + player + " " + texto);
        }
      };
      window.enviarKick = function (player) {
        const texto = prompt("motivo de expulsion para " + player);
        if (texto) {
          if (texto && texto.trim() !== "") {
            mcCommand("kick " + player + " " + texto);
          }
        }
      };
      var botones = btnmsg + " " + btnkick + " " + btnBan;
      var btnOp = '<button onclick="updatePlayers(); mcCommand(\'op ' + p.name + '\')">⬆️</button>';
      var btnDeop = '<button onclick="updatePlayers(); mcCommand(\'deop ' + p.name + '\')">⬇️</button>';
      html +=
        '<tr class="' + selectedClass + '" data-id="' + p.id + '">' +
        '<td><img src="https://mineskin.eu/helm/' + p.name + '/100.png" alt="skin" /></td>' +
        '<td>' + p.name + '</td>' +
        '<td>' + p.gamemode + '</td>' +
        '<td>' + btnOp + p.rango + btnDeop + '</td>' +
        '<td>' + p.mundo + '</td>' +
        '<td> ' + botones + ' </td>' +
        '</tr>';

      // Fila de detalle justo debajo del seleccionado
      if (selected) {
        html +=
          '<tr class="detail-row">' +
          '<td colspan="5">' +
          buildDetailHtml(p) +
          '</td>' +
          '</tr>';
      }
    }

    tbody.innerHTML = html;
  }

  // ---------------- Filtro ----------------
  function applyFilter() {

    var q = filterInput.value.toLowerCase();

    filteredPlayers = [];

    for (var i = 0; i < allPlayers.length; i++) {

      var p = allPlayers[i];

      var busqueda =
        p.name + " " +
        p.gamemode + " " +
        p.rango + " " +
        p.mundo + " " +
        p.coordenadas.x + " " +
        p.coordenadas.y + " " +
        p.coordenadas.z;

      if (busqueda.toLowerCase().includes(q)) {
        filteredPlayers.push(p);
      }
    }

    renderTable();
    count.textContent = filteredPlayers.length + " / " + allPlayers.length;
  }

  // ---------------- Selección ----------------
  function selectPlayerById(id) {
    selectedId = id;
    renderTable();
  }

  // ---------------- Carga JSON ----------------
  fetch("./js/API/players.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {

      allPlayers = data;
      filteredPlayers = data;

      if (allPlayers.length > 0) {
        selectedId = allPlayers[0].id;
      }

      renderTable();
      count.textContent = filteredPlayers.length + " / " + allPlayers.length;
    });

  // Eventos
  filterInput.addEventListener("input", applyFilter);

  tbody.addEventListener("click", function (e) {

    var tr = e.target.closest("tr");
    if (!tr) return;

    var id = Number(tr.getAttribute("data-id"));
    selectPlayerById(id);
  });
}




///////////////////////////////////
// Sincronización jugadores
///////////////////////////////////

async function updatePlayers() {
  await mcCommand("save-all");
  await new Promise(r => setTimeout(r, 1000));

  await fetch("/syncPlayers");



  window.location.reload();

}