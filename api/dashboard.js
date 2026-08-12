// api/dashboard.js
// Serverless function for Vercel – returns datos del dashboard
module.exports = (req, res) => {
  // Obtener la fecha local de hoy en formato YYYY-MM-DD
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const hoy = `${year}-${month}-${day}`;

  // TODO: conectar a tu base de datos (Firestore, etc.)
  // Por ahora devolvemos datos ficticios
  const datos = {
    fecha: hoy,
    ventas: 120,
    ingresos: 4500,
    gastos: 300
  };

  res.status(200).json(datos);
};
