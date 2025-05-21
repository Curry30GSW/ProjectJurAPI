const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/clientesController');
const multerEdit = require('../middlewares/multerEdit');

router.get('/clientes', ClienteController.listarClientes);
router.post('/insert-clientes', ClienteController.agregarCliente);
router.get('/clientes/:cedula', ClienteController.buscarClientePorCedula);
router.put('/clientes/:cedula', multerEdit, ClienteController.actualizarCliente);

module.exports = router;