// controllers/notificacionController.js
const Notificacion = require('../models/notificacionesModel');

const notificacionController = {
    crearNotificacion: async (req, res) => {
        try {
            const { fecha_notificacion, observaciones, asesor_notificacion, id_embargos } = req.body;

            // Validación básica
            if (!fecha_notificacion || !observaciones || !id_embargos) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan campos requeridos'
                });
            }

            // Llama al método createOrUpdate
            const resultado = await Notificacion.createOrUpdate(
                fecha_notificacion,
                observaciones,
                asesor_notificacion || 'Sistema', // Valor por defecto si no viene
                id_embargos
            );

            // Respuesta según si fue creado o actualizado
            if (resultado.created) {
                return res.status(201).json({
                    success: true,
                    message: 'Notificación creada exitosamente',
                    data: { id_notificacion: resultado.id_notificacion }
                });
            } else if (resultado.updated) {
                return res.status(200).json({
                    success: true,
                    message: 'Notificación actualizada exitosamente',
                    data: { id_notificacion: resultado.id_notificacion }
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'No se pudo crear ni actualizar la notificación'
                });
            }

        } catch (error) {
            console.error('Error en crearNotificacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear o actualizar la notificación',
                error: error.message
            });
        }
    },

    obtenerNotificacionesPorEmbargo: async (req, res) => {
        try {
            const { id_embargos } = req.params;

            const notificaciones = await Notificacion.findByEmbargoId(id_embargos);

            res.status(200).json({
                success: true,
                data: notificaciones
            });
        } catch (error) {
            console.error('Error en obtenerNotificacionesPorEmbargo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones',
                error: error.message
            });
        }
    },

    obtenerTodasLasNotificaciones: async (req, res) => {
        try {
            const notificaciones = await Notificacion.findAll();
            res.status(200).json({
                success: true,
                data: notificaciones
            });
        } catch (error) {
            console.error('Error en obtenerTodasLasNotificaciones:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener notificaciones',
                error: error.message
            });
        }
    },

    actualizarFecha: async (req, res) => {
        const { id } = req.params;
        const { nueva_fecha } = req.body;

        if (!nueva_fecha) {
            return res.status(400).json({ success: false, message: 'La nueva fecha es requerida' });
        }

        try {
            const actualizada = await Notificacion.updateFechaById(id, nueva_fecha);
            if (actualizada) {
                res.json({ success: true, message: 'Fecha actualizada correctamente' });
            } else {
                res.status(404).json({ success: false, message: 'Notificación no encontrada' });
            }
        } catch (error) {
            console.error('Error actualizando la notificación:', error.message);
            res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
    }

};

module.exports = notificacionController;