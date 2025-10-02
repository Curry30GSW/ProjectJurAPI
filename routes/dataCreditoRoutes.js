const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authorizeRoles = require("../middlewares/authorizeRoles");
const permisos = require("../permisos");
const dataCreditoController = require('../controllers/dataCreditoController');
const authenticateToken = require('../middlewares/authMiddleware');


// Configurar multer para guardar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
});

router.get('/clientes-datacredito', authenticateToken, authorizeRoles(permisos), dataCreditoController.listarClientesConDataCredito);

router.post('/subir-documento', authenticateToken, authorizeRoles(permisos), upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { cedula } = req.body;

        if (!file) {
            return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });
        }

        const ext = path.extname(file.originalname);
        const fileName = `dataCredito-${cedula}${ext}`;
        const destFolder = path.join(__dirname, '..', 'uploads', 'dataCredito');
        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

        const finalPath = path.join(destFolder, fileName);
        fs.writeFileSync(finalPath, file.buffer);

        req.file.filename = fileName;
        req.file.storedPath = `/uploads/dataCredito/${fileName}`;
        req.body.cedula = cedula;

        await dataCreditoController.subirDocumento(req, res);
    } catch (error) {
        console.error('Error en la subida:', error);
        res.status(500).json({ message: 'Error al subir el documento.' });
    }
});

router.post('/mover-area', authenticateToken, authorizeRoles(permisos), dataCreditoController.moverArea);

router.get('/notificaciones', authenticateToken, authorizeRoles(permisos), dataCreditoController.notificaciones);


module.exports = router;
