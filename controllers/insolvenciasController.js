const insolvenciaModel = require('../models/insolvenciasModel');
const path = require('path');
const fs = require('fs');
const uploadPDF = require('../middlewares/uploadPDF');


const insolvenciaController = {

    listarClientesConInsolvencia: async (req, res) => {
        try {
            const clientes = await insolvenciaModel.getAllClienteInsol();
            res.status(200).json(clientes);
        } catch (error) {
            console.error('Error en el controlador al listar clientes con Insolvencia:', error);
            res.status(500).json({ error: 'Ocurrió un error al obtener los datos.' });
        }
    },


    actualizarInsolvencia: (req, res) => {
        uploadPDF(req, res, async (err) => {
            if (err) {
                console.error('Error en la subida del archivo:', err.message);
                return res.status(400).json({ success: false, message: err.message });
            }

            const {
                id_cliente,
                cuadernillo,
                fecha_cuadernillo,
                radicacion,
                fecha_radicacion,
                correcciones,
                tipo_proceso,
                juzgado,
                nombre_liquidador,
                telefono_liquidador,
                correo_liquidador,
                pago_liquidador,
                terminacion,
                motivo_insolvencia,
                asesor_insolvencia,
                datos_desprendible
            } = req.body;

            // Determinar si hay correcciones (texto no vacío)
            const hayCorrecciones = correcciones && correcciones.trim() !== '';

            let ruta_pdf = null;
            let desprendibleData = {};
            let ruta_autoliquidador = null;

            try {
                // Procesar archivos solo si NO hay correcciones
                if (req.files && !hayCorrecciones) {
                    // Procesar archivoPDF (Acta de aceptación)
                    if (req.files['archivoPDF'] && req.files['archivoPDF'][0]) {
                        const archivo = req.files['archivoPDF'][0];
                        const nombreArchivo = `Acta-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'acta-aceptacion');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                        const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
                        fs.writeFileSync(rutaCompleta, archivo.buffer);
                        ruta_pdf = `/uploads/acta-aceptacion/${nombreArchivo}`;
                    }

                    // Procesar desprendiblePDF
                    if (req.files['desprendiblePDF'] && req.files['desprendiblePDF'][0]) {
                        const desprendible = req.files['desprendiblePDF'][0];
                        const nombreDesprendible = `Desprendible-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'desprendibles_insolvencia');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                        const rutaCompleta = path.join(carpetaDestino, nombreDesprendible);
                        fs.writeFileSync(rutaCompleta, desprendible.buffer);

                        try {
                            desprendibleData = datos_desprendible ? JSON.parse(datos_desprendible) : {};
                            desprendibleData.desprendible = `/uploads/desprendibles_insolvencia/${nombreDesprendible}`;
                        } catch (e) {
                            console.error('Error al parsear datos_desprendible:', e);
                        }
                    }

                    // Procesar autoliquidador
                    if (req.files['archivoAutoliquidador'] && req.files['archivoAutoliquidador'][0]) {
                        const autoliquidador = req.files['archivoAutoliquidador'][0];
                        const nombreAutoliquidador = `Autoliquidador-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'autoliquidador');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                        const rutaCompleta = path.join(carpetaDestino, nombreAutoliquidador);
                        fs.writeFileSync(rutaCompleta, autoliquidador.buffer);
                        ruta_autoliquidador = `/uploads/autoliquidador/${nombreAutoliquidador}`;
                    }
                }

                // 1. Actualizar datos de insolvencia
                const updateData = {
                    id_cliente,
                    correcciones: hayCorrecciones ? correcciones : null
                };

                // Solo agregar otros campos si NO hay correcciones
                if (!hayCorrecciones) {
                    Object.assign(updateData, {
                        cuadernillo,
                        fecha_cuadernillo,
                        radicacion,
                        fecha_radicacion,
                        acta_aceptacion: ruta_pdf,
                        tipo_proceso,
                        juzgado,
                        nombre_liquidador,
                        telefono_liquidador,
                        correo_liquidador,
                        pago_liquidador,
                        terminacion,
                        motivo_insolvencia,
                        asesor_insolvencia,
                        autoliquidador: ruta_autoliquidador,
                        valor_liquidador: req.body.valor_liquidador || '0',
                        cuota_1: req.body.cuota_1 || '0',
                        cuota_2: req.body.cuota_2 || '0',
                        cuota_3: req.body.cuota_3 || '0',
                        cuota_4: req.body.cuota_4 || '0',
                        fecha_1: req.body.fecha_1 || null,
                        fecha_2: req.body.fecha_2 || null,
                        fecha_3: req.body.fecha_3 || null,
                        fecha_4: req.body.fecha_4 || null
                    });
                }

                const resultado = await insolvenciaModel.updateInsolvenciaData(updateData);

                // 2. Procesar datos adicionales solo si NO hay correcciones
                if (resultado.affectedRows > 0 && resultado.id_insolvencia && !hayCorrecciones) {
                    const id_insolvencia = resultado.id_insolvencia;

                    // AUDIENCIAS
                    let audienciasArray = [];
                    if (typeof req.body.audiencias === 'string') {
                        try {
                            audienciasArray = JSON.parse(req.body.audiencias);
                        } catch (e) {
                            console.warn('No se pudo parsear audiencias:', e.message);
                        }
                    } else if (Array.isArray(req.body.audiencias)) {
                        audienciasArray = req.body.audiencias;
                    }

                    const audienciasLimpias = audienciasArray
                        .filter(a => a.descripcion && a.fecha)
                        .map(a => ({
                            audiencia: a.descripcion,
                            fecha_audiencias: a.fecha,
                            id_insolvencia
                        }));

                    if (audienciasLimpias.length > 0) {
                        await insolvenciaModel.insertarAudiencias(id_insolvencia, audienciasLimpias);
                    }

                    // DESPRENDIBLES
                    if (Object.keys(desprendibleData).length > 0) {
                        const desprendibleLimpio = {
                            estado_desprendible: desprendibleData.estado_desprendible || '',
                            desprendible: desprendibleData.desprendible || null,
                            obs_desprendible: desprendibleData.obs_desprendible || '',
                            cuota_pagar: desprendibleData.datos_parcial?.cuota_pagar || ''
                        };
                        await insolvenciaModel.insertarDesprendibles(id_insolvencia, [desprendibleLimpio]);
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Datos de insolvencia, audiencias y desprendibles guardados correctamente.'
                    });
                } else if (resultado.affectedRows > 0) {
                    return res.status(200).json({
                        success: true,
                        message: 'Correcciones guardadas correctamente.'
                    });
                } else {
                    return res.status(404).json({
                        success: false,
                        message: 'No se encontró el cliente para actualizar.'
                    });
                }
            } catch (error) {
                console.error('Error al actualizar insolvencia:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno al actualizar insolvencia.'
                });
            }
        });
    },

    obtenerInsolvenciaPorId: async (req, res) => {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'El id_insolvencia es requerido.' });
        }

        try {
            const datos = await insolvenciaModel.getClienteInsolById(id);

            if (!datos) {
                return res.status(404).json({ success: false, message: 'No se encontró información para este ID.' });
            }

            res.status(200).json({ success: true, data: datos });
        } catch (error) {
            console.error('Error al obtener insolvencia por ID:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    },


};

module.exports = insolvenciaController;
