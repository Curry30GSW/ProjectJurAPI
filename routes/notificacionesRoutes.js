// routes/notificacionRoutes.js
const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionesController');
const authorizeRoles = require("../middlewares/authorizeRoles");
const permisos = require("../permisos");
const authenticateToken = require('../middlewares/authMiddleware');


// Crear nueva notificación
router.post('/notificaciones-embargos', authenticateToken, authorizeRoles(permisos), notificacionController.crearNotificacion);

// Obtener notificaciones por ID de embargo
router.get('/notificaciones-embargo/:id_embargos', authenticateToken, authorizeRoles(permisos), notificacionController.obtenerNotificacionesPorEmbargo);

router.get('/notificaciones-embargo', authenticateToken, authorizeRoles(permisos), notificacionController.obtenerTodasLasNotificaciones);

router.put('/notificaciones/:id', authenticateToken, authorizeRoles(permisos), notificacionController.actualizarFecha);



module.exports = router;