const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const embargosController = require('../controllers/embargosController');
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

router.get('/clientes-embargos', authenticateToken, embargosController.listarClientesConEmbargos);

router.get('/cliente-embargos/:cedula', authenticateToken, embargosController.obtenerClientePorCedula);

router.put('/embargo/:id_embargos', authenticateToken, embargosController.updateEmbargo);

router.get('/embargos/:id', authenticateToken, embargosController.getEmbargoPorId);

router.get('/embargo/aceptados', authenticateToken, embargosController.listarClientesConEmbargosAceptados);

router.post('/subir-desprendible-embargos', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const { id_embargos, estado_embargo } = req.body;

        if (!file) {
            return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });
        }

        const ext = path.extname(file.originalname);
        const fileName = `desprendible-ID:${id_embargos}${ext}`;
        const destFolder = path.join(__dirname, '..', 'uploads', 'desprendibles_embargos');

        if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder, { recursive: true });

        const finalPath = path.join(destFolder, fileName);
        fs.writeFileSync(finalPath, file.buffer);

        req.file.filename = fileName;
        req.file.storedPath = `/desprendibles_embargos/${fileName}`;

        // Enviar datos al controlador
        req.body.id_embargos = id_embargos;
        req.body.estado_embargo = estado_embargo;

        await embargosController.subirDocumento(req, res);
    } catch (error) {
        console.error('Error en la subida:', error);
        res.status(500).json({ message: 'Error al subir el documento.' });
    }
});

router.post('/crear-embargos', authenticateToken, embargosController.insertarEmbargo);

router.put('/embargos/:id/notificar', authenticateToken, embargosController.actualizarNotificar);

module.exports = router;