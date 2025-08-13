const dataCreditoModel = require('../models/dataCreditoModel');

const dataCreditoController = {

    listarClientesConDataCredito: async (req, res) => {
        try {
            const clientes = await dataCreditoModel.getAllClienteData();
            res.status(200).json(clientes);
        } catch (error) {
            console.error('Error en el controlador al listar clientes con DataCrédito:', error);
            res.status(500).json({ error: 'Ocurrió un error al obtener los datos.' });
        }
    },

    subirDocumento: async (req, res) => {
        try {
            const cedula = req.body.cedula;
            const usuario = req.body.usuario;

            if (!req.file) {
                return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });
            }

            const rutaDocumento = req.file.storedPath;
            const ahora = new Date();
            const fechaLocal = new Date(ahora.getTime() - 5 * 60 * 60 * 1000); // Resta 5 horas
            const fechaAdjunto = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');


            await dataCreditoModel.saveDocumentData(cedula, rutaDocumento, fechaAdjunto, usuario);

            res.status(200).json({ message: 'Documento guardado correctamente.' });
        } catch (error) {
            console.error('Error en subirDocumento:', error);
            res.status(500).json({ message: 'Error al guardar el documento.' });
        }
    },

    moverArea: async (req, res) => {
        try {
            const cedula = req.body.cedula;
            const nuevaArea = req.body.area;
            const usuario = req.body.usuario;


            if (!cedula || !nuevaArea || !usuario) {
                return res.status(400).json({ message: 'Faltan datos requeridos.' });
            }

            const nombreCliente = await dataCreditoModel.moveAreaClient(cedula, nuevaArea, usuario);

            res.status(200).json({
                message: `El cliente <b>${nombreCliente}</b>, fue trasladado correctamente.`
            });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    notificaciones: async (req, res) => {
        try {
            const notificaciones = await dataCreditoModel.obtenerUltimasNotificaciones();
            res.json(notificaciones);
        } catch (error) {
            console.error('Error al obtener notificaciones:', error);
            res.status(500).json({ error: 'Error al obtener notificaciones' });
        }
    }

};

module.exports = dataCreditoController;
