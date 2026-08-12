// Helper para obtener la fecha local actual en formato YYYY-MM-DD (Evita el desfase UTC de toISOString)
export function getTodayLocalDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToLocal(dateInput) {
  if (!dateInput) return getTodayLocalDate();
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getTodayLocalDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
