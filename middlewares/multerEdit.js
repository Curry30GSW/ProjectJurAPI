const path = require('path');
const multer = require('multer');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'uploads/otros';
        if (file.fieldname === 'foto_perfil') folder = 'uploads/fotoPerfil';
        if (file.fieldname === 'cedula_pdf') folder = 'uploads/cedulaPdf';
        if (file.fieldname === 'desprendible_pago') folder = 'uploads/desprendible';
        if (file.fieldname === 'data_credito') folder = 'uploads/dataCredito';
        if (file.fieldname === 'bienes_inmuebles[]') folder = 'uploads/bienesInmuebles';
        if (file.fieldname === 'recibos_publicos_pdf') folder = 'uploads/recibosPublicos';

        const absolutePath = path.resolve(folder);
        if (!fs.existsSync(absolutePath)) {
            fs.mkdirSync(absolutePath, { recursive: true });
        }
        cb(null, absolutePath);
    },
    filename: (req, file, cb) => {
        const cedula = req.params.cedula || 'sinCedula';
        let name = 'archivo-' + cedula + path.extname(file.originalname);

        if (file.fieldname === 'foto_perfil') name = `fotoPerfil-${cedula}${path.extname(file.originalname)}`;
        if (file.fieldname === 'cedula_pdf') name = `cedulaPdf-${cedula}${path.extname(file.originalname)}`;
        if (file.fieldname === 'desprendible_pago') name = `desprendible-${cedula}${path.extname(file.originalname)}`;
        if (file.fieldname === 'data_credito') name = `dataCredito-${cedula}${path.extname(file.originalname)}`;
        if (file.fieldname === 'bienes_inmuebles[]') name = `bienesInmuebles-${cedula}-${Date.now()}${path.extname(file.originalname)}`;
        if (file.fieldname === 'recibos_publicos_pdf') name = `reciboPublico-${cedula}-${Date.now()}${path.extname(file.originalname)}`;

        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Tipo de archivo no permitido'), false);
    }
});

module.exports = upload.fields([
    { name: 'foto_perfil', maxCount: 1 },
    { name: 'cedula_pdf', maxCount: 1 },
    { name: 'desprendible_pago', maxCount: 1 },
    { name: 'data_credito', maxCount: 1 },
    { name: 'bienes_inmuebles[]', maxCount: 10 },
    { name: 'recibos_publicos_pdf', maxCount: 1 }
]);
