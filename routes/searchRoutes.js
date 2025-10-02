const express = require('express');
const router = express.Router();
const controller = require('../controllers/searchController');
const authenticateToken = require('../middlewares/authMiddleware');

// Ruta para buscar persona por cédula
router.get('/buscar-persona/:cedula', authenticateToken, controller.buscarPersonaPorCedula);

module.exports = router;
