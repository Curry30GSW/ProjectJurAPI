const TitulosModel = require('../models/titulosModel');

const TitulosController = {
    getAllTitulos: async (req, res) => {
        try {
            const titulos = await TitulosModel.getAllTitulos();
            res.status(200).json(titulos);
        } catch (error) {
            console.error('Error al obtener los títulos:', error);
            res.status(500).json({ message: 'Error al obtener los títulos' });
        }
    },
};

module.exports = TitulosController;
