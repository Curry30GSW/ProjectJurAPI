const multer = require('multer');

const uploadPDF = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB por archivo
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF'), false);
        }
    }
}).fields([
    { name: 'archivoPDF', maxCount: 1 },
    { name: 'desprendiblePDF', maxCount: 1 },
    { name: 'archivoAutoliquidador', maxCount: 1 }
]);

module.exports = uploadPDF;
