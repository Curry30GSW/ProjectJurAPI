// routes/notificacionRoutes.js
const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionesController');

// Crear nueva notificación
router.post('/notificaciones-embargos', notificacionController.crearNotificacion);

// Obtener notificaciones por ID de embargo
router.get('/notificaciones-embargo/:id_embargos', notificacionController.obtenerNotificacionesPorEmbargo);

router.get('/notificaciones-embargo', notificacionController.obtenerTodasLasNotificaciones);

router.put('/notificaciones/:id', notificacionController.actualizarFecha);



module.exports = router;