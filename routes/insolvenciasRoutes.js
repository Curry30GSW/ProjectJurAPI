const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const insolvenciaController = require('../controllers/insolvenciasController');
const authenticateToken = require('../middlewares/authMiddleware');


router.get('/clientes-insolvencias', authenticateToken, insolvenciaController.listarClientesConInsolvencia);

router.get('/cliente-insolvencias/:cedula', authenticateToken, insolvenciaController.obtenerClientePorCedula);

router.put('/actualizar-insolvencias', authenticateToken, insolvenciaController.actualizarInsolvencia);

router.get('/insolvencia/id/:id', authenticateToken, insolvenciaController.obtenerInsolvenciaPorId);

router.get('/insolvencia/parcial-deuda', authenticateToken, insolvenciaController.listarClienteParcialODeudas);

router.get('/conteo-parcial-deudas', authenticateToken, insolvenciaController.conteoParcialDeudas);


router.post('/guardar-insolvencia', authenticateToken, insolvenciaController.guardarInsolvencia);



module.exports = router;