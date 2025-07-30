const express = require('express');
const router = express.Router();
const TitulosController = require('../controllers/titulosController');


router.get('/titulos', TitulosController.getAllTitulos);

module.exports = router;
