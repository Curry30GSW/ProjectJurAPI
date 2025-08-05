const embargosModel = require('../models/embargosModel');
const path = require('path');
const fs = require('fs');
const uploadPDF = require('../middlewares/uploadPDF');
const pool = require('../config/db');

const embargosController = {

    listarClientesConEmbargos: async (req, res) => {
        try {
            const embargos = await embargosModel.getAllClienteEmbargos();
            res.json(embargos);
        } catch (error) {
            console.error('Error al obtener los embargos:', error);
            res.status(500).json({ error: 'Error al obtener los embargos' });
        }
    },

    obtenerClientePorCedula: async (req, res) => {
        const { cedula } = req.params;

        try {
            const cliente = await embargosModel.getClientelByCedula(cedula);

            if (!cliente) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            res.json(cliente);
        } catch (error) {
            console.error('Error en el controlador al obtener cliente por cédula:', error);
            res.status(500).json({ message: 'Error interno del servidor' });
        }
    },

    getEmbargoForEdit: async (req, res) => {
        try {
            const { id_embargos } = req.params;

            if (!id_embargos) {
                return res.status(400).json({ message: 'ID de embargo es requerido' });
            }

            const embargo = await embargosModel.getEmbargoById(id_embargos);

            if (!embargo) {
                return res.status(404).json({ message: 'Embargo no encontrado' });
            }

            res.json(embargo);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Obtener todos los embargos de un cliente (opcional)
    getEmbargosByCliente: async (req, res) => {
        try {
            const { id_cliente } = req.params;

            if (!id_cliente) {
                return res.status(400).json({ message: 'ID de cliente es requerido' });
            }

            const embargos = await embargosModel.getEmbargosByCliente(id_cliente);
            res.json(embargos);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getEmbargoPorId: async (req, res) => {
        const { id } = req.params;

        try {
            const embargo = await embargosModel.getEmbargoById(id);

            if (!embargo) {
                return res.status(404).json({ mensaje: 'Embargo no encontrado' });
            }

            res.status(200).json({ success: true, embargo });
        } catch (error) {
            res.status(500).json({ success: false, mensaje: 'Error al obtener el embargo' });
        }
    },

    // Actualizar un embargo específico
    updateEmbargo: async (req, res) => {
        try {
            const { id_embargos } = req.params;
            const embargoData = req.body;

            if (!id_embargos) {
                return res.status(400).json({ message: 'ID de embargo es requerido' });
            }

            // Asignar el asesor que realiza la modificación
            embargoData.asesor_embargo = embargoData.nombreUsuario || 'Sistema';

            const updated = await embargosModel.updateEmbargo(id_embargos, embargoData);

            if (!updated) {
                return res.status(404).json({ message: 'No se pudo actualizar el embargo' });
            }

            res.json({
                success: true,
                message: 'Embargo actualizado correctamente',
                id_embargos: id_embargos
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    listarClientesConEmbargosAceptados: async (req, res) => {
        try {
            const embargos = await embargosModel.getAllClienteEmbargosAceptados();
            res.json(embargos);
        } catch (error) {
            console.error('Error al obtener los embargos aceptados:', error);
            res.status(500).json({ error: 'Error al obtener los embargos aceptados' });
        }
    },

    subirDocumento: async (req, res) => {
        try {
            const { id_embargos, estado_embargo } = req.body;

            if (!req.file) {
                return res.status(400).json({ message: 'No se adjuntó ningún archivo.' });
            }

            const rutaDocumento = req.file.storedPath;

            // Obtener fecha actual (restando 5 horas para hora local)
            const ahora = new Date();
            const fechaLocal = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);

            // Fecha del desprendible: ahora
            const fechaDesprendible = fechaLocal.toISOString().slice(0, 19).replace('T', ' ');

            // Fecha de terminación: 4 meses después
            const fechaTerminacionObj = new Date(fechaLocal);
            fechaTerminacionObj.setMonth(fechaTerminacionObj.getMonth() + 4);
            const fechaTerminacion = fechaTerminacionObj.toISOString().slice(0, 19).replace('T', ' ');

            console.log('➡️ Enviando a modelo:', {
                id_embargos,
                rutaDocumento,
                fechaDesprendible,
                fechaTerminacion,
                estado_embargo
            });

            await embargosModel.saveDocumentData(
                id_embargos,
                rutaDocumento,
                fechaDesprendible,
                fechaTerminacion,
                estado_embargo
            );

            res.status(200).json({ message: 'Documento guardado correctamente.' });

        } catch (error) {
            console.error('Error en subirDocumento:', error);
            res.status(500).json({ message: 'Error al guardar el documento.' });
        }
    },

    insertarEmbargo: async (req, res) => {
        try {
            const embargoData = req.body;

            const resultado = await embargosModel.insertarEmbargo(embargoData, embargosModel.updateEmbargo);

            if (resultado.action === 'insert') {
                res.status(201).json({
                    message: 'Embargo creado exitosamente.',
                    id_embargos: resultado.id
                });
            } else if (resultado.action === 'update') {
                res.status(200).json({
                    message: 'Embargo actualizado correctamente.',
                    id_embargos: resultado.id
                });
            } else {
                res.status(400).json({ message: 'No se pudo procesar la solicitud.' });
            }
        } catch (error) {
            console.error('Error en el controlador de embargo:', error);
            res.status(500).json({ message: 'Error del servidor.', error: error.message });
        }
    },

    actualizarNotificar: async (req, res) => {
        const { id } = req.params;
        const { notificar } = req.body;
        try {
            const result = await embargosModel.actualizarNotificar(id, notificar);
            if (result) {
                return res.status(200).json({ success: true, mensaje: 'Actualización exitosa' });
            } else {
                return res.status(404).json({ success: false, mensaje: 'Embargo no encontrado' });
            }
        } catch (error) {
            console.error('[BACKEND 7] Error en modelo:', error);
            return res.status(500).json({ success: false, error: 'Error interno del servidor' });
        }
    }


};

module.exports = embargosController;