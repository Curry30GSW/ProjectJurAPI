const express = require('express');
const router = express.Router();
const sabanaController = require('../controllers/sabanaController');
const uploadSabana = require('../middlewares/uploadSabana');
const authorizeRoles = require("../middlewares/authorizeRoles");
const permisos = require("../permisos");
const authenticateToken = require('../middlewares/authMiddleware');

// Subir archivo
router.post('/subir-sabana', authenticateToken, authorizeRoles(permisos), uploadSabana.single('archivo'), sabanaController.subirSabana);

// Descargar archivo
router.get('/descargar-sabana', sabanaController.descargarSabana);

// Obtener fecha y usuario
router.get('/fechas-usuarios', authenticateToken, authorizeRoles(permisos), sabanaController.obtenerFechasUsuarios);

module.exports = router;
