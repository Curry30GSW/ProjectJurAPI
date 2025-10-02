const express = require('express');
const router = express.Router();
const carteraController = require('../controllers/carteraController');
const authenticateToken = require('../middlewares/authMiddleware');

// Rutas
router.get('/clientes-cartera', authenticateToken, carteraController.getAllClienteCartera);
router.get('/clientes-cartera-banco', authenticateToken, carteraController.getAllClienteCarteraBanco);
router.get('/clientes-cartera/:cedula', authenticateToken, carteraController.getClientelByCedula);
router.post('/creditos/crear', authenticateToken, carteraController.insertarCredito);
router.post('/creditos-banco/crear', authenticateToken, carteraController.insertarCreditoBanco);
router.get('/cliente/:id_cliente', authenticateToken, carteraController.obtenerCreditosPorCliente);
router.get('/cartera/:id_creditos', authenticateToken, carteraController.getCreditoById);
router.get('/cartera-banco/:id_banco', authenticateToken, carteraController.getCreditoBancoById);
router.post('/comisiones', authenticateToken, carteraController.getComisionesPorRango);
router.post('/generar-cuotas/:id_insolvencia', authenticateToken, carteraController.generarCuotas);
router.get("/cuotas/pendientes", authenticateToken, carteraController.getCuotasPendientes);
router.post("/cartera/abonar", authenticateToken, carteraController.abonarCuotas);
router.post("/cuota/actualizar", authenticateToken, carteraController.actualizarCuota);
router.get("/cuotas/pendientes/:id", authenticateToken, carteraController.obtenerCuotasPendientes);

module.exports = router;
