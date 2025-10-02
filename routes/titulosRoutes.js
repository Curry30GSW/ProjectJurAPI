const express = require('express');
const router = express.Router();
const TitulosController = require('../controllers/titulosController');
const { uploadTitulos } = require('../middlewares/multerTitulos');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/titulos', authenticateToken, TitulosController.getAllTitulos);
router.post('/insert-titulos', (req, res, next) => {
    uploadTitulos(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, TitulosController.insertarTitulo);

router.get('/titulos/:id_embargos', authenticateToken, TitulosController.obtenerPorEmbargo);

router.put('/titulos/:id_embargos', (req, res, next) => {
    uploadTitulos(req, res, (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        next();
    });
}, TitulosController.actualizarTitulo);

module.exports = router;
