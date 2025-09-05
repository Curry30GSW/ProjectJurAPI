const express = require('express');
const router = express.Router();
const carteraController = require('../controllers/carteraController');

// Rutas
router.get('/clientes-cartera', carteraController.getAllClienteCartera);
router.get('/clientes-cartera-banco', carteraController.getAllClienteCarteraBanco);
router.get('/clientes-cartera/:cedula', carteraController.getClientelByCedula);
router.post('/creditos/crear', carteraController.insertarCredito);
router.post('/creditos-banco/crear', carteraController.insertarCreditoBanco);
router.get('/cliente/:id_cliente', carteraController.obtenerCreditosPorCliente);
router.get('/cartera/:id_creditos', carteraController.getCreditoById);
router.get('/cartera-banco/:id_banco', carteraController.getCreditoBancoById);
router.post('/comisiones', carteraController.getComisionesPorRango);

module.exports = router;
