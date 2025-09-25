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

    obtenerClientePorCedula: async (req, res) => {
        const { cedula } = req.params;
        try {
            const cliente = await insolvenciaModel.getClientelByCedula(cedula);

            if (!cliente) {
                return res.status(404).json({ message: 'Cliente no encontrado' })
            }
            res.json(cliente);
        } catch (error) {
            console.error('Error en el controlador al obtener cliente por cedula:', error);
            res.status(500).json({ error: 'Error interno del servidor' })
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
                fecha_terminacion,
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
                        fecha_terminacion,
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
                        message: hayCorrecciones
                            ? 'Correcciones guardadas correctamente.'
                            : 'Datos de insolvencia, audiencias y desprendibles guardados correctamente.',
                        id_insolvencia
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

    listarClienteParcialODeudas: async (req, res) => {
        try {
            const clientes = await insolvenciaModel.getAllClienteParcialOrDeuda();
            res.status(200).json(clientes);
        } catch (error) {
            console.error('Error en controlador listarClienteParcialODeudas:', error);
            res.status(500).json({ message: 'Error al obtener los clientes con PARCIAL o DEUDAS' });
        }
    },

    obtenerConteoPorPagaduria: async (req, res) => {
        try {
            // Llamamos al modelo sin agrupar por "otras"
            const data = await ClienteModel.getConteoPorPagaduria();

            // Pagadurías que quieres considerar específicamente
            const pagaduriasPermitidas = [
                'colpensiones',
                'fopep',
                'fiduprevisora',
                'porvenir',
                'seguros alfa',
                'secretaria educacion',
            ];

            const resultado = [];
            let otras = 0;

            data.forEach(row => {
                const nombreNormalizado = row.nombre_pagaduria.toLowerCase().trim();

                if (pagaduriasPermitidas.includes(nombreNormalizado)) {
                    resultado.push({
                        nombre_pagaduria: nombreNormalizado,
                        cantidad: row.cantidad
                    });
                } else {
                    otras += row.cantidad;
                }
            });

            if (otras > 0) {
                resultado.push({
                    nombre_pagaduria: 'otras',
                    cantidad: otras
                });
            }

            res.json(resultado);
        } catch (error) {
            console.error('Error al obtener el conteo de pagadurías:', error.message);
            res.status(500).json({ error: 'Error al obtener el conteo de pagadurías' });
        }
    },

    conteoParcialDeudas: async (req, res) => {
        try {
            const data = await insolvenciaModel.getConteoParcialDeudas();

            // Normalizamos para asegurarnos de que siempre existan ambos (aunque sea 0)
            const estados = ['PARCIAL', 'DEUDAS'];
            const resultado = estados.map(e => {
                const encontrado = data.find(d => d.estado_desprendible === e);
                return {
                    estado: e,
                    cantidad: encontrado ? encontrado.cantidad : 0
                };
            });

            res.json(resultado);
        } catch (error) {
            console.error("Error en conteoParcialDeudas:", error.message);
            res.status(500).json({ error: 'Error al obtener conteo de PARCIAL y DEUDAS' });
        }
    },

    insertarInsolvencia: (req, res) => {
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
                fecha_terminacion,
                motivo_insolvencia,
                asesor_insolvencia,
                datos_desprendible
            } = req.body;

            const hayCorrecciones = correcciones && correcciones.trim() !== '';

            let ruta_pdf = null;
            let desprendibleData = {};
            let ruta_autoliquidador = null;

            try {
                // Procesar archivos solo si NO hay correcciones
                if (req.files && !hayCorrecciones) {
                    // Acta aceptación
                    if (req.files['archivoPDF'] && req.files['archivoPDF'][0]) {
                        const archivo = req.files['archivoPDF'][0];
                        const nombreArchivo = `Acta-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'acta-aceptacion');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });

                        const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
                        fs.writeFileSync(rutaCompleta, archivo.buffer);
                        ruta_pdf = `/uploads/acta-aceptacion/${nombreArchivo}`;
                    }

                    // Desprendible
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

                    // Autoliquidador
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

                // 1. Insertar insolvencia
                const insertData = {
                    id_cliente,
                    correcciones: hayCorrecciones ? correcciones : null
                };

                if (!hayCorrecciones) {
                    Object.assign(insertData, {
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
                        fecha_terminacion,
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

                const resultado = await insolvenciaModel.insertarInsolvencia(
                    insertData,
                    insolvenciaModel.updateInsolvenciaById
                );

                if (resultado.id && !hayCorrecciones) {
                    const id_insolvencia = resultado.id;

                    // 2. AUDIENCIAS
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

                    // 3. DESPRENDIBLES
                    if (Object.keys(desprendibleData).length > 0) {
                        const desprendibleLimpio = {
                            estado_desprendible: desprendibleData.estado_desprendible || '',
                            desprendible: desprendibleData.desprendible || null,
                            obs_desprendible: desprendibleData.obs_desprendible || '',
                            cuota_pagar: desprendibleData.datos_parcial?.cuota_pagar || ''
                        };
                        await insolvenciaModel.insertarDesprendibles(id_insolvencia, [desprendibleLimpio]);
                    }

                    return res.status(201).json({
                        success: true,
                        message: 'Insolvencia, audiencias y desprendibles insertados correctamente.',
                        id_insolvencia
                    });
                } else if (resultado.id) {
                    return res.status(200).json({
                        success: true,
                        message: 'Correcciones guardadas correctamente.',
                        id_insolvencia: resultado.id
                    });
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'No se pudo insertar la insolvencia.'
                    });
                }
            } catch (error) {
                console.error('Error al insertar insolvencia:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno al insertar insolvencia.',
                    error: error.message
                });
            }
        });
    },

    // Función para verificar el estado de una insolvencia
    verificarEstadoInsolvencia: async (req, res) => {
        try {
            const { id_cliente } = req.params;

            if (!id_cliente) {
                return res.status(400).json({
                    success: false,
                    message: 'El id_cliente es requerido.'
                });
            }

            const insolvencia = await insolvenciaModel.verificarInsolvenciaPorCliente(id_cliente);

            if (!insolvencia) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró insolvencia para este cliente.'
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    id_insolvencia: insolvencia.id_insolvencia,
                    creada: insolvencia.creada === 1
                }
            });
        } catch (error) {
            console.error('Error al verificar estado de insolvencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor.'
            });
        }
    },

    guardarInsolvencia: (req, res) => {
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
                fecha_terminacion,
                motivo_insolvencia,
                asesor_insolvencia,
                datos_desprendible
            } = req.body;

            if (!id_cliente) {
                return res.status(400).json({ success: false, message: 'El id_cliente es requerido.' });
            }

            // Determinar si hay correcciones
            const hayCorrecciones = correcciones && correcciones.trim() !== '';

            let ruta_pdf = null;
            let desprendibleData = {};
            let ruta_autoliquidador = null;

            try {
                // Procesar archivos solo si NO hay correcciones
                if (req.files && !hayCorrecciones) {
                    // Acta de aceptación
                    if (req.files['archivoPDF'] && req.files['archivoPDF'][0]) {
                        const archivo = req.files['archivoPDF'][0];
                        const nombreArchivo = `Acta-ID-${id_cliente}.pdf`;
                        const carpetaDestino = path.join(__dirname, '..', 'uploads', 'acta-aceptacion');
                        if (!fs.existsSync(carpetaDestino)) fs.mkdirSync(carpetaDestino, { recursive: true });
                        const rutaCompleta = path.join(carpetaDestino, nombreArchivo);
                        fs.writeFileSync(rutaCompleta, archivo.buffer);
                        ruta_pdf = `/uploads/acta-aceptacion/${nombreArchivo}`;
                    }

                    // Desprendible
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

                    // Autoliquidador
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

                // Construir datos principales
                const insolvenciaData = {
                    id_cliente,
                    correcciones: hayCorrecciones ? correcciones : null,
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
                    fecha_terminacion,
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
                };

                // Insertar o actualizar según la lógica del modelo
                const resultado = await insolvenciaModel.insertarInsolvencia(
                    insolvenciaData,
                    insolvenciaModel.updateInsolvenciaById
                );

                const id_insolvencia = resultado.id;

                // Procesar audiencias y desprendibles solo si no hay correcciones
                if (!hayCorrecciones && id_insolvencia) {
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
                }

                return res.status(200).json({
                    success: true,
                    message: resultado.action === 'insert'
                        ? 'Insolvencia creada correctamente.'
                        : 'Insolvencia actualizada correctamente.',
                    id_insolvencia
                });

            } catch (error) {
                console.error('Error en guardarInsolvencia:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error interno al guardar insolvencia.'
                });
            }
        });
    }




};

module.exports = insolvenciaController;
