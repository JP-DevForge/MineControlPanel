export async function loadSection(group, file) {
  const ventana = document.querySelector(".ventana");

  if (!ventana) {
    console.error("No existe .ventana");
    return false;
  }

  try {
    const response = await fetch(`/sections/${group}/${file}.html`);

    if (!response.ok) {
      throw new Error(`No se pudo cargar ${group}/${file}.html`);
    }

    ventana.innerHTML = await response.text();
    return true;

  } catch (error) {
    console.error(error);

    ventana.innerHTML = `
      <p class="empty-message">
        Error cargando la sección.
      </p>
    `;

    return false;
  }
}