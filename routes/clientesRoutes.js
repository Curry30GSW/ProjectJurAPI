const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clientesController');
const multerEdit = require('../middlewares/multerEdit');
const authorizeRoles = require("../middlewares/authorizeRoles");
const permisos = require("../permisos");
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/clientes', authenticateToken, authorizeRoles(permisos), ClienteController.listarClientes);
router.post('/insert-clientes', authenticateToken, authorizeRoles(permisos), ClienteController.agregarCliente);
router.get('/clientes/:cedula', authenticateToken, authorizeRoles(permisos), ClienteController.buscarClientePorCedula);
router.put('/clientes/:cedula', authenticateToken, authorizeRoles(permisos), multerEdit, ClienteController.actualizarCliente);
router.get('/conteo-pagadurias', authenticateToken, authorizeRoles(permisos), ClienteController.obtenerConteoPorPagaduria);
router.get('/clientes/por-pagaduria/:nombre', authenticateToken, authorizeRoles(permisos), ClienteController.obtenerClientesPorPagaduria);
module.exports = router;