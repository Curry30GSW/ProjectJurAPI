const TitulosModel = require('../models/titulosModel');
const path = require('path');
const fs = require('fs');

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

    insertarTitulo: async (req, res) => {
        try {
            const procesarArchivo = (file) => {
                if (!file || !file[0]) return null;
                const fullPath = file[0].path;
                return path.relative(path.join(__dirname, '../uploads'), fullPath);
            };

            // Preparar datos para la inserción
            const datos = {
                terminacion_ofic: req.body.terminacion_ofic || null,
                terminacion_oficpdf: procesarArchivo(req.files?.terminacion_pdf),
                terminacion_juzg: req.body.terminacion_juzg || null,
                terminacion_juzgpdf: procesarArchivo(req.files?.aceptacion_pdf),
                solicitud_titulos: req.body.solicitud_titulos || null,
                orden_pago: req.body.orden_pago || null,
                orden_pagopdf: procesarArchivo(req.files?.orden_pago_pdf),
                asesor_titulos: req.body.asesor_titulos || 'Asesor no especificado',
                id_embargos: req.body.id_embargos || null,
                id_cliente: req.body.id_cliente || null
            };

            // Insertar en la base de datos
            const resultado = await TitulosModel.insertTitulo(datos);

            res.status(201).json({
                success: true,
                message: 'Datos de título guardados correctamente',
                data: resultado
            });

        } catch (error) {
            console.error('Error al insertar título:', error);

            // Limpiar archivos subidos en caso de error
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    if (fileArray?.[0]?.path) {
                        try {
                            fs.unlinkSync(fileArray[0].path);
                        } catch (err) {
                            console.error('Error al eliminar archivo:', err);
                        }
                    }
                });
            }

            res.status(500).json({
                success: false,
                message: error.message || 'Error al guardar los datos'
            });
        }
    },

    obtenerPorEmbargo: async (req, res) => {
        try {
            const { id_embargos } = req.params;

            const resultado = await TitulosModel.obtenerDatosPorEmbargo(id_embargos);

            if (resultado.length === 0) {
                return res.status(404).json({ mensaje: 'No se encontró información para ese embargo' });
            }

            res.json(resultado[0]); // o `res.json(resultado);` si esperas más de un resultado
        } catch (error) {
            console.error('Error al obtener datos del embargo:', error);
            res.status(500).json({ error: 'Error al consultar los datos' });
        }
    },

    actualizarTitulo: async (req, res) => {
        try {
            const id_embargos = req.params.id_embargos;
            const tituloActual = await TitulosModel.obtenerPorId(id_embargos);
            if (!tituloActual) {
                return res.status(404).json({ mensaje: 'No se encontró el título para actualizar' });
            }

            const {
                terminacion_ofic,
                terminacion_juzg,
                solicitud_titulos,
                orden_pago,
                asesor_titulos,
                mantener_terminacion_pdf,
                mantener_aceptacion_pdf,
                mantener_orden_pdf
            } = req.body;


            const terminacion_oficpdf = req.files?.terminacion_oficpdf?.[0]?.filename
                || (mantener_terminacion_pdf === 'true' ? tituloActual.terminacion_oficpdf : null);

            const terminacion_juzgpdf = req.files?.terminacion_juzgpdf?.[0]?.filename
                || (mantener_aceptacion_pdf === 'true' ? tituloActual.terminacion_juzgpdf : null);

            const orden_pagopdf = req.files?.orden_pagopdf?.[0]?.filename
                || (mantener_orden_pdf === 'true' ? tituloActual.orden_pagopdf : null);

            const datos = {
                terminacion_ofic,
                terminacion_oficpdf,
                terminacion_juzg,
                terminacion_juzgpdf,
                solicitud_titulos,
                orden_pago,
                orden_pagopdf,
                asesor_titulos,
                id_embargos
            };

            const resultado = await TitulosModel.updateTitulo(datos);

            if (resultado.affectedRows > 0) {
                res.status(200).json({ mensaje: 'Título actualizado correctamente' });
            } else {
                res.status(404).json({ mensaje: 'No se encontró el título para actualizar' });
            }

        } catch (error) {
            console.error('Error al actualizar título:', error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    }

};

module.exports = TitulosController;
