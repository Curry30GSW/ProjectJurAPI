const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta si no existe
const uploadDir = path.join(__dirname, '../uploads/sabanas');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Borrar cualquier archivo que haya en la carpeta
        fs.readdirSync(uploadDir).forEach(f => {
            fs.unlinkSync(path.join(uploadDir, f));
        });

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        cb(null, `sabana${extension}`); // Siempre mismo nombre
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xls' || ext === '.xlsx') {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos Excel (.xls, .xlsx)'));
    }
};

module.exports = multer({ storage, fileFilter });
