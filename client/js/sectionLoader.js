export async function loadSection(group, file) {
  const ventana = document.querySelector(".ventana");
  const response = await fetch(`/sections/${group}/${file}.html`);

  if (!response.ok) {
    ventana.innerHTML = `<p class="empty-message">Error cargando ${file}</p>`;
    return false;
  }

  ventana.innerHTML = await response.text();
  return true;
}