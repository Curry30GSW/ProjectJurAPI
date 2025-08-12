const express = require('express');
const router = express.Router();
const sabanaController = require('../controllers/sabanaController');
const uploadSabana = require('../middlewares/uploadSabana');

// Subir archivo
router.post('/subir-sabana', uploadSabana.single('archivo'), sabanaController.subirSabana);

// Descargar archivo
router.get('/descargar-sabana', sabanaController.descargarSabana);

// Obtener fecha y usuario
router.get('/fechas-usuarios', sabanaController.obtenerFechasUsuarios);

module.exports = router;
