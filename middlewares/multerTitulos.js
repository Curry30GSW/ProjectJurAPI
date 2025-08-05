const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configurar storage para guardar en subcarpetas específicas
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subfolder = '';

        // Determinar la subcarpeta según el campo del archivo
        switch (file.fieldname) {
            case 'terminacion_pdf':
                subfolder = 'terminacion';
                break;
            case 'aceptacion_pdf':
                subfolder = 'aceptacion';
                break;
            case 'orden_pago_pdf':
                subfolder = 'ordenpago';
                break;
            default:
                subfolder = 'otros';
        }

        const uploadDir = path.join(__dirname, '../uploads/titulos', subfolder);

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },

    filename: function (req, file, cb) {
        const idEmbargos = req.body.id_embargos || 'sinid';
        let prefix = '';

        switch (file.fieldname) {
            case 'terminacion_pdf':
                prefix = 'terminacion';
                break;
            case 'aceptacion_pdf':
                prefix = 'aceptacion';
                break;
            case 'orden_pago_pdf':
                prefix = 'orden_pago';
                break;
            default:
                prefix = 'archivo';
        }

        const ext = path.extname(file.originalname);
        const filename = `${prefix}_${idEmbargos}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos PDF (formato .pdf)'), false);
    }
};

const uploadTitulos = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
}).fields([
    { name: 'terminacion_pdf', maxCount: 1 },
    { name: 'aceptacion_pdf', maxCount: 1 },
    { name: 'orden_pago_pdf', maxCount: 1 }
]);

// Middleware para manejar errores de Multer
const handleMulterErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Error de Multer (ej: límite de tamaño)
        return res.status(400).json({
            success: false,
            message: `Error al subir archivo: ${err.message}`
        });
    } else if (err) {
        // Otros errores
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }
    next();
};

module.exports = { uploadTitulos, handleMulterErrors };