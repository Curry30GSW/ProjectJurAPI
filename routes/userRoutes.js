const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authorizeRoles = require("../middlewares/authorizeRoles");
const permisos = require("../permisos");
const authenticateToken = require('../middlewares/authMiddleware');

// Crear
router.post('/users-create', authenticateToken, authorizeRoles(permisos), UserController.create);

// Actualizar
router.put('/users-updated/:id', authenticateToken, authorizeRoles(permisos), UserController.update);

// Habilitar
router.post('/users/:id/enable', authenticateToken, authorizeRoles(permisos), UserController.enable);

// Inhabilitar
router.post('/users/:id/disable', authenticateToken, authorizeRoles(permisos), UserController.disable);

// Listar todos
router.get('/users', authenticateToken, authorizeRoles(permisos), UserController.getAll);

router.get('/users-comisiones', authenticateToken, authorizeRoles(permisos), UserController.getAllUsers);

router.get('/users/:id', authenticateToken, authorizeRoles(permisos), UserController.getById);



module.exports = router;