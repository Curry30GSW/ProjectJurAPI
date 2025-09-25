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

    generarCuotas: async (req, res) => {
        try {
            const { id_insolvencia } = req.params;

            if (!id_insolvencia) {
                return res.status(400).json({ success: false, message: 'El id_insolvencia es requerido' });
            }

            const result = await carteraModel.generarCuotasCartera(id_insolvencia);

            if (!result.success) {
                return res.status(400).json(result); // errores de validación o duplicado
            }

            res.status(200).json(result);
        } catch (error) {
            console.error('Error en controlador generarCuotas:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    getCuotasPendientes: async (req, res) => {
        try {
            const cuotas = await carteraModel.getCuotasPendientes();
            res.json(cuotas);
        } catch (error) {
            res.status(500).json({
                message: "Error al obtener las cuotas pendientes",
                error: error.message,
            });
        }
    },

    abonarCuotas: async (req, res) => {
        try {
            const { id_cliente, monto } = req.body;
            let restante = parseFloat(monto);

            // Obtener y ORDENAR cuotas pendientes por fecha (más antigua primero)
            let cuotas = await carteraModel.obtenerCuotasPendientes(id_cliente);
            cuotas.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));

            if (!cuotas.length) {
                return res.status(404).json({ success: false, message: "No hay cuotas pendientes" });
            }

            const hoy = new Date();

            // --- 1. Pagar TODAS las cuotas vencidas primero (en orden cronológico) ---
            for (let cuota of cuotas) {
                if (restante <= 0) break;

                // Solo procesar cuotas vencidas no pagadas
                if (new Date(cuota.fecha_programada) < hoy && cuota.estado !== "PAGADA") {
                    let saldo = cuota.saldo_pendiente > 0 ? cuota.saldo_pendiente : cuota.valor_cuota;

                    if (restante >= saldo) {
                        await carteraModel.actualizarCuota({
                            id_cuota: cuota.id_cuota,
                            estado: "PAGADA",
                            saldo_pendiente: 0
                        });
                        restante -= saldo;
                    } else {
                        await carteraModel.actualizarCuota({
                            id_cuota: cuota.id_cuota,
                            estado: "PARCIAL",
                            saldo_pendiente: saldo - restante
                        });
                        restante = 0;
                        break;
                    }
                }
            }

            // --- 2. Pagar la PRÓXIMA cuota pendiente (cuota corriente) ---
            // Encuentra la primera cuota pendiente (vencida o no)
            const cuotaCorriente = cuotas.find(c => c.estado !== "PAGADA");

            if (restante > 0 && cuotaCorriente) {
                let saldo = cuotaCorriente.saldo_pendiente > 0 ?
                    cuotaCorriente.saldo_pendiente :
                    cuotaCorriente.valor_cuota;

                if (restante >= saldo) {
                    await carteraModel.actualizarCuota({
                        id_cuota: cuotaCorriente.id_cuota,
                        estado: "PAGADA",
                        saldo_pendiente: 0
                    });
                    restante -= saldo;
                } else {
                    await carteraModel.actualizarCuota({
                        id_cuota: cuotaCorriente.id_cuota,
                        estado: "PARCIAL",
                        saldo_pendiente: saldo - restante
                    });
                    restante = 0;
                }
            }

            // --- 3. Reducir plazo: pagar cuotas futuras (desde la más lejana) ---
            if (restante > 0) {
                // Ordenar cuotas pendientes por fecha (más lejana primero)
                const cuotasFuturas = cuotas.filter(c =>
                    new Date(c.fecha_programada) > hoy && c.estado !== "PAGADA"
                ).sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));

                for (let cuota of cuotasFuturas) {
                    if (restante <= 0) break;

                    let saldo = cuota.saldo_pendiente > 0 ? cuota.saldo_pendiente : cuota.valor_cuota;

                    if (restante >= saldo) {
                        await carteraModel.actualizarCuota({
                            id_cuota: cuota.id_cuota,
                            estado: "PAGADA",
                            saldo_pendiente: 0
                        });
                        restante -= saldo;
                    } else {
                        await carteraModel.actualizarCuota({
                            id_cuota: cuota.id_cuota,
                            estado: "PARCIAL",
                            saldo_pendiente: saldo - restante
                        });
                        restante = 0;
                        break;
                    }
                }
            }

            // --- 4. Si aún queda dinero, aplicar como abono a capital ---
            if (restante > 0) {
                // Aquí va la lógica para aplicar el abono a capital
                await carteraModel.registrarAbonoCapital({
                    id_cliente: id_cliente,
                    monto: restante,
                    fecha: new Date()
                });
            }

            res.json({
                success: true,
                message: "Abono registrado correctamente",
                restante: restante
            });

        } catch (err) {
            console.error("Error al registrar abono:", err);
            res.status(500).json({ success: false, message: "Error al registrar abono" });
        }
    },

    actualizarCuota: async (req, res) => {
        try {
            const { id_cuota, estado, saldo_pendiente } = req.body;

            if (!id_cuota || !estado) {
                return res.status(400).json({ success: false, message: "Faltan parámetros." });
            }

            await carteraModel.actualizarCuota({ id_cuota, estado, saldo_pendiente });

            res.json({ success: true, message: "Cuota actualizada correctamente" });
        } catch (err) {
            console.error("Error al actualizar cuota:", err);
            res.status(500).json({ success: false, message: "Error en el servidor" });
        }
    },

    obtenerCuotasPendientes: async (req, res) => {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: "El id_cliente es requerido" });
            }

            const cuotas = await carteraModel.obtenerCuotasPendientes(id);

            // Devolver siempre array
            res.json(cuotas);
        } catch (error) {
            console.error("Error en obtenerCuotasPendientes:", error);
            res.status(500).json({ error: "Error al obtener cuotas pendientes" });
        }
    },

};

module.exports = carteraController;