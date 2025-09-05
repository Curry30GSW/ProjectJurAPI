const pool = require('../config/db');

const carteraModel = {

    getAllClienteCartera: async () => {
        try {
            const [rows] = await pool.query(`
       SELECT 
            c.nombres, 
            c.apellidos, 
            c.cedula, 
            c.foto_perfil,
            c.telefono,
            t.id_creditos,
            t.valor_total,
            t.fecha_prestamo,
            t.observacion_opcion,
            t.obs_credito,
            t.id_cliente
        FROM 
            clientes c
        JOIN 
            creditos t ON c.id_cliente = t.id_cliente`);
            return rows;
        } catch (error) {
            console.error('Error al obtener los clientes con DataCrédito:', error);
            throw error;
        }
    },

    getAllClienteCarteraBanco: async () => {
        try {
            const [rows] = await pool.query(`
       SELECT 
            c.nombres, 
            c.apellidos, 
            c.cedula, 
            c.foto_perfil,
            c.telefono,
            b.id_banco,
            b.monto_solicitado,
            b.monto_aprobado,
            b.banco,
            b.negociacion,
            b.fecha_banco,
            b.asesor_banco
        FROM 
            clientes c
        JOIN
            creditos_bancos b ON c.id_cliente = b.id_cliente`);
            return rows;
        } catch (error) {
            console.error('Error al obtener los clientes con DataCrédito:', error);
            throw error;
        }
    },

    getClientelByCedula: async (cedula) => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
       SELECT 
        c.id_cliente, 
        c.nombres, 
        c.apellidos, 
        c.cedula, 
        c.correo,
        c.fecha_vinculo,
        c.foto_perfil,
        c.telefono,
        c.ciudad,
        t.id_creditos,
        COALESCE(GROUP_CONCAT(p.nombre_pagaduria SEPARATOR ', '), c.empresa) AS pagadurias
      FROM 
        clientes c
      JOIN 
        creditos t ON c.id_cliente = t.id_cliente
      LEFT JOIN 
        pagadurias_cliente p ON c.id_cliente = p.id_cliente
      WHERE 
        c.cedula = ?
      GROUP BY 
        c.id_cliente, c.nombres, c.apellidos, c.cedula, c.correo,
        c.fecha_vinculo, c.foto_perfil, c.telefono, c.ciudad, t.id_creditos, c.empresa
      LIMIT 1
      `, [cedula]);

            return rows[0];
        } catch (error) {
            console.error('Error al obtener el cliente por cédula:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    verificarCreditosPorCliente: async (id_cliente) => {
        const [rows] = await pool.query('SELECT * FROM creditos WHERE id_cliente = ?', [id_cliente]);
        return rows;
    },

    insertarCredito: async (creditoData) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar si ya existe un crédito con cred_creado = 1
            const [existente] = await connection.query(`
                SELECT id_creditos 
                FROM creditos 
                WHERE id_cliente = ? AND cred_creado = 1
                LIMIT 1
            `, [creditoData.id_cliente]);

            if (existente.length > 0) {
                // Insertar nuevo crédito (múltiples créditos permitidos)
                const [result] = await connection.query(`
                    INSERT INTO creditos (
                        id_cliente,
                        valor_prestado,
                        interes_prestado,
                        valor_total,
                        fecha_prestamo,
                        asesor,
                        comision_asesor,
                        observacion_opcion,
                        obs_credito,
                        cred_creado
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [
                    creditoData.id_cliente,
                    creditoData.valor_prestado,
                    creditoData.interes_prestado,
                    creditoData.valor_total,
                    creditoData.fecha_prestamo,
                    creditoData.asesor,
                    creditoData.comision_asesor,
                    creditoData.observacion_opcion,
                    creditoData.obs_credito
                ]);

                await connection.commit();
                return { action: 'insert', id: result.insertId };
            } else {
                // Buscar el crédito más reciente para actualizar
                const [ultimos] = await connection.query(`
                    SELECT id_creditos 
                    FROM creditos 
                    WHERE id_cliente = ? 
                    ORDER BY id_creditos DESC 
                    LIMIT 1
                `, [creditoData.id_cliente]);

                if (ultimos.length === 0) {
                    // Insertar nuevo crédito si no existe ninguno
                    const [result] = await connection.query(`
                        INSERT INTO creditos (
                            id_cliente,
                            valor_prestado,
                            interes_prestado,
                            valor_total,
                            fecha_prestamo,
                            asesor,
                            comision_asesor,
                            observacion_opcion,
                            obs_credito,
                            cred_creado
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    `, [
                        creditoData.id_cliente,
                        creditoData.valor_prestado,
                        creditoData.interes_prestado,
                        creditoData.valor_total,
                        creditoData.fecha_prestamo,
                        creditoData.asesor,
                        creditoData.comision_asesor,
                        creditoData.observacion_opcion,
                        creditoData.obs_credito
                    ]);

                    await connection.commit();
                    return { action: 'insert', id: result.insertId };
                }

                // Actualizar el crédito existente
                const idActualizar = ultimos[0].id_creditos;
                const [result] = await connection.query(`
                    UPDATE creditos SET
                        valor_prestado = ?,
                        interes_prestado = ?,
                        valor_total = ?,
                        fecha_prestamo = ?,
                        asesor = ?,
                        comision_asesor = ?,
                        observacion_opcion = ?,
                        obs_credito = ?,
                        cred_creado = 1
                    WHERE id_creditos = ?
                `, [
                    creditoData.valor_prestado,
                    creditoData.interes_prestado,
                    creditoData.valor_total,
                    creditoData.fecha_prestamo,
                    creditoData.asesor,
                    creditoData.comision_asesor,
                    creditoData.observacion_opcion,
                    creditoData.obs_credito,
                    idActualizar
                ]);

                await connection.commit();
                return { action: 'update', id: idActualizar, updated: result.affectedRows };
            }
        } catch (error) {
            await connection.rollback();
            console.error('Error en insertarCredito:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    insertarCreditoBanco: async (creditoData) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Verificar si ya existe un crédito con cred_creado = 1
            const [existente] = await connection.query(`
                SELECT id_banco 
                FROM creditos_bancos 
                WHERE id_cliente = ? AND credb_creado = 1
                LIMIT 1
            `, [creditoData.id_cliente]);

            if (existente.length > 0) {
                // Insertar nuevo crédito (múltiples créditos permitidos)
                const [result] = await connection.query(`
                    INSERT INTO creditos_bancos (
                        id_cliente,
                        monto_solicitado,
                        monto_aprobado,
                        banco,
                        negociacion,
                        credb_creado,
                        asesor_banco
                    ) VALUES (?, ?, ?, ?, ?, 1, ?)
                `, [
                    creditoData.id_cliente,
                    creditoData.monto_solicitado,
                    creditoData.monto_aprobado,
                    creditoData.banco,
                    creditoData.negociacion,
                    creditoData.asesor_banco
                ]);

                await connection.commit();
                return { action: 'insert', id: result.insertId };
            } else {
                // Buscar el crédito más reciente para actualizar
                const [ultimos] = await connection.query(`
                    SELECT id_banco
                    FROM creditos_bancos
                    WHERE id_cliente = ?
                    ORDER BY id_banco DESC
                    LIMIT 1
                `, [creditoData.id_cliente]);

                if (ultimos.length === 0) {
                    // Insertar nuevo crédito si no existe ninguno
                    const [result] = await connection.query(`
                        INSERT INTO creditos_bancos (
                            id_cliente,
                            monto_solicitado,
                            monto_aprobado,
                            banco,
                            negociacion,
                            credb_creado,
                            asesor_banco
                        ) VALUES (?, ?, ?, ?, ?, 1, ?)
                    `, [
                        creditoData.id_cliente,
                        creditoData.monto_solicitado,
                        creditoData.monto_aprobado,
                        creditoData.banco,
                        creditoData.negociacion,
                        creditoData.asesor_banco
                    ]);

                    await connection.commit();
                    return { action: 'insert', id: result.insertId };
                }

                // Actualizar el crédito existente
                const idActualizar = ultimos[0].id_banco;
                const [result] = await connection.query(`
                    UPDATE creditos_bancos SET
                        monto_solicitado = ?,
                        monto_aprobado = ?,
                        banco = ?,
                        negociacion = ?,
                        asesor_banco = ?,
                        credb_creado = 1
                    WHERE id_banco = ?
                `, [
                    creditoData.monto_solicitado,
                    creditoData.monto_aprobado,
                    creditoData.banco,
                    creditoData.negociacion,
                    creditoData.asesor_banco,
                    creditoData.credb_creado,
                    idActualizar
                ]);

                await connection.commit();
                return { action: 'update', id: idActualizar, updated: result.affectedRows };
            }
        } catch (error) {
            await connection.rollback();
            console.error('Error en insertarCredito:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    getCreditoById: async (id_creditos) => {
        try {
            const [rows] = await pool.query(`
            SELECT 
                c.nombres, 
                c.apellidos, 
                c.cedula, 
                c.foto_perfil,
                c.telefono,
                t.id_creditos,
                t.valor_total,
                t.valor_prestado,
                t.interes_prestado,
                t.asesor,
                t.comision_asesor,
                t.fecha_prestamo,
                t.observacion_opcion,
                t.obs_credito,
                t.id_cliente
            FROM 
                clientes c
            JOIN 
                creditos t ON c.id_cliente = t.id_cliente
            WHERE t.id_creditos = ?`, [id_creditos]);

            return rows[0];
        } catch (error) {
            console.error('Error al obtener crédito por ID:', error);
            throw error;
        }
    },

    getCreditoBancoById: async (id_banco) => {
        try {
            const [rows] = await pool.query(`
            SELECT 
                c.nombres, 
                c.apellidos, 
                c.cedula, 
                c.foto_perfil,
                c.telefono,
                b.id_banco,
                b.monto_solicitado,
                b.monto_aprobado,
                b.banco,
                b.negociacion,
                b.asesor_banco,
                b.fecha_banco,
                b.id_cliente
            FROM
                clientes c
            JOIN
                creditos_bancos b ON c.id_cliente = b.id_cliente
            WHERE b.id_banco = ?`, [id_banco]);

            return rows[0];
        } catch (error) {
            console.error('Error al obtener crédito por ID:', error);
            throw error;
        }
    },

    getComisionesPorRango: async (fechaInicio, fechaFin) => {
        try {
            const [rows] = await pool.query(`
            SELECT 
                asesor,
                SUM(comision_asesor) AS total_comision,
                COUNT(*) AS total_creditos
            FROM creditos
            WHERE fecha_comision BETWEEN ? AND ?
            GROUP BY asesor
        `, [fechaInicio, fechaFin]);

            return rows;
        } catch (error) {
            console.error('Error al obtener comisiones por rango:', error);
            throw error;
        }
    },

    generarCuotasCartera: async (id_insolvencia) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Consultar insolvencia y cliente
            const [rows] = await connection.query(`
            SELECT 
                c.id_cliente,
                c.valor_insolvencia,
                d.estado_desprendible
            FROM desprendible d
            INNER JOIN insolvencia i ON d.id_insolvencia = i.id_insolvencia
            INNER JOIN clientes c ON i.id_cliente = c.id_cliente
            WHERE d.id_insolvencia = ?
            LIMIT 1
        `, [id_insolvencia]);

            if (rows.length === 0) throw new Error('No se encontró insolvencia');
            const { id_cliente, valor_insolvencia, estado_desprendible } = rows[0];

            if (estado_desprendible !== 'LIMPIO') {
                return { success: false, message: 'Desprendible no está en estado LIMPIO' };
            }

            // Verificar si ya existen cuotas
            const [existentes] = await connection.query(`
            SELECT COUNT(*) AS total FROM cartera_insolvencia WHERE id_insolvencia = ?
        `, [id_insolvencia]);

            if (existentes[0].total > 0) {
                return { success: false, message: 'Las cuotas ya fueron generadas' };
            }

            const valorCuota = +(valor_insolvencia / 48).toFixed(2);

            // Generar 48 cuotas
            const cuotas = [];
            for (let i = 1; i <= 48; i++) {
                cuotas.push([id_cliente, id_insolvencia, i, valorCuota]);
            }

            await connection.query(`
            INSERT INTO cartera_insolvencia (id_cliente, id_insolvencia, numero_cuota, valor_cuota)
            VALUES ?
        `, [cuotas]);

            await connection.commit();
            return { success: true, message: 'Cuotas generadas correctamente' };

        } catch (error) {
            await connection.rollback();
            console.error('Error al generar cuotas:', error);
            throw error;
        } finally {
            connection.release();
        }
    }


};

module.exports = carteraModel;  