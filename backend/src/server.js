require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./database/connection');

const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

initDB().then(() => {
  console.log('Base de datos inicializada');
}).catch(err => {
  console.error('Error al inicializar DB:', err);
});

app.use(compression());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/cuts', require('./routes/cuts'));
app.use('/api/secondary-cuts', require('./routes/secondary_cuts'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/improvements', require('./routes/improvements'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// OpenAPI UI Documentation Setup
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema Fátima - Tutti Bocado' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor Fátima corriendo en puerto ${PORT}`);
  });
}

module.exports = app;