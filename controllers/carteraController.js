const carteraModel = require('../models/carteraModel');

function getTipoObservacion(observacion_opcion) {
    const tipos = {
        '1': 'Créditos',
        '2': 'Insolvencia',
        '3': 'Tarjetas',
        '4': 'Embargos'
    };
    return tipos[observacion_opcion] || 'General';
}

const carteraController = {

    getAllClienteCartera: async (req, res) => {
        try {
            const clientes = await carteraModel.getAllClienteCartera();
            res.status(200).json({
                success: true,
                data: clientes
            });
        } catch (error) {
            console.error('Error en getAllClienteCartera:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los clientes de cartera'
            });
        }
    },

    getAllClienteCarteraBanco: async (req, res) => {
        try {
            const clientes = await carteraModel.getAllClienteCarteraBanco();
            res.status(200).json({
                success: true,
                data: clientes
            });
        } catch (error) {
            console.error('Error en getAllClienteCarteraBanco:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los clientes de cartera banco'
            });
        }
    },

    getClientelByCedula: async (req, res) => {
        const { cedula } = req.params; // se espera en la ruta /cartera/:cedula
        try {
            const cliente = await carteraModel.getClientelByCedula(cedula);

            if (!cliente) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            res.status(200).json({
                success: true,
                data: cliente
            });
        } catch (error) {
            console.error('Error en getClientelByCedula:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el cliente por cédula'
            });
        }
    },

    insertarCredito: async (req, res) => {
        try {
            const creditoData = req.body;

            // Validaciones básicas
            if (!creditoData.id_cliente) {
                return res.status(400).json({ message: 'ID de cliente es requerido' });
            }

            if (!creditoData.valor_prestado || !creditoData.interes_prestado) {
                return res.status(400).json({ message: 'Valor prestado e interés son requeridos' });
            }

            // Calcular valor total si no viene
            if (!creditoData.valor_total) {
                const valor = parseFloat(creditoData.valor_prestado.replace(/,/g, ''));
                const interes = parseFloat(creditoData.interes_prestado);
                creditoData.valor_total = (valor + (valor * interes / 100)).toFixed(2);
            }

            // CORRECCIÓN: Transformar observacion_opcion directamente
            creditoData.observacion_opcion = getTipoObservacion(creditoData.observacion_opcion);

            const resultado = await carteraModel.insertarCredito(creditoData);

            if (resultado.action === 'insert') {
                res.status(201).json({
                    message: 'Crédito creado exitosamente.',
                    id_creditos: resultado.id
                });
            } else if (resultado.action === 'update') {
                res.status(200).json({
                    message: 'Crédito actualizado correctamente.',
                    id_creditos: resultado.id
                });
            } else {
                res.status(400).json({ message: 'No se pudo procesar la solicitud.' });
            }
        } catch (error) {
            console.error('Error en el controlador de crédito:', error);
            res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    },

    insertarCreditoBanco: async (req, res) => {
        try {
            const creditoData = req.body;

            // Validaciones básicas
            if (!creditoData.id_cliente) {
                return res.status(400).json({ message: 'ID de cliente es requerido' });
            }

            const resultado = await carteraModel.insertarCreditoBanco(creditoData);

            if (resultado.action === 'insert') {
                res.status(201).json({
                    message: 'Crédito creado exitosamente.',
                    id_creditos: resultado.id
                });
            } else if (resultado.action === 'update') {
                res.status(200).json({
                    message: 'Crédito actualizado correctamente.',
                    id_creditos: resultado.id
                });
            } else {
                res.status(400).json({ message: 'No se pudo procesar la solicitud.' });
            }
        } catch (error) {
            console.error('Error en el controlador de crédito:', error);
            res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    },

    obtenerCreditosPorCliente: async (req, res) => {
        try {
            const { id_cliente } = req.params;
            const creditos = await carteraModel.verificarCreditosPorCliente(id_cliente);
            res.json(creditos);
        } catch (error) {
            console.error('Error al obtener créditos:', error);
            res.status(500).json({ message: 'Error del servidor' });
        }
    },

    getCreditoById: async (req, res) => {
        try {
            const { id_creditos } = req.params;
            const credito = await carteraModel.getCreditoById(id_creditos);

            if (!credito) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            res.json(credito);
        } catch (error) {
            console.error('Error en getCreditoById:', error);
            res.status(500).json({ message: 'Error al obtener crédito' });
        }

    },

    getCreditoBancoById: async (req, res) => {
        try {
            const { id_banco } = req.params;
            const credito = await carteraModel.getCreditoBancoById(id_banco);

            if (!credito) {
                return res.status(404).json({ message: 'Crédito no encontrado' });
            }

            res.json(credito);
        } catch (error) {
            console.error('Error en getCreditoById:', error);
            res.status(500).json({ message: 'Error al obtener crédito' });
        }

    },

    getComisionesPorRango: async (req, res) => {
        try {
            const { fechaInicio, fechaFin } = req.body;

            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({ message: "Debe enviar fechaInicio y fechaFin" });
            }

            const data = await carteraModel.getComisionesPorRango(fechaInicio, fechaFin);

            res.json({
                success: true,
                fechaInicio,
                fechaFin,
                data
            });
        } catch (error) {
            console.error("Error en getComisionesPorRango:", error);
            res.status(500).json({ success: false, message: "Error en el servidor" });
        }
    },
};

module.exports = carteraController;