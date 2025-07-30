require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const clienteRoutes = require('./routes/clientesRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadsRoutes = require('./routes/uploadsRoutes');
const dataCreditoRoutes = require('./routes/dataCreditoRoutes');
const insolvenciasRoutes = require('./routes/insolvenciasRoutes');
const embargosRoutes = require('./routes/embargosRoutes');
const notificacionRoutes = require('./routes/notificacionesRoutes');
const titulosRoutes = require('./routes/titulosRoutes');
const methodOverride = require('method-override');


app.use(methodOverride('_method'));


// Middleware para parsear JSON
app.use(express.json());


app.use(cors({
  origin: "http://127.0.0.1:5501", // Debes usar el frontend correcto
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true  // 🛑 Habilita las cookies en CORS
}));


// Middleware para aceptar multipart/form-data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API conectada correctamente');
});

// Middleware para servir imágenes estáticas desde /uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', clienteRoutes);
app.use('/auth', authRoutes);
app.use('/api', uploadsRoutes);
app.use('/api', dataCreditoRoutes);
app.use('/api', insolvenciasRoutes);
app.use('/api', embargosRoutes);
app.use('/api', notificacionRoutes);
app.use('/api', titulosRoutes);
// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
