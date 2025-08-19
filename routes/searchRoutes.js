const express = require('express');
const router = express.Router();
const controller = require('../controllers/searchController');

// Ruta para buscar persona por cédula
router.get('/buscar-persona/:cedula', controller.buscarPersonaPorCedula);

module.exports = router;
