export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
export async function getServerById(id) {
  const response = await fetch(`/api/servers/${id}`);

  if (!response.ok) {
    return null;
  }

  return await response.json();
}