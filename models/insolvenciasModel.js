const pool = require('../config/db');

const insolvenciaModel = {
    getAllClienteInsol: async () => {
        try {
            const [rows] = await pool.query(`
              SELECT 
                    c.id_cliente, 
                    c.nombres, 
                    c.apellidos, 
                    c.cedula, 
                    c.correo,
                    c.fecha_vinculo,
                    c.foto_perfil,
                    c.telefono,
                    c.direccion,
                    c.ciudad,
                    c.valor_cuota,
                    c.porcentaje,
                    c.valor_insolvencia,
                    c.numero_cuotas,
                    c.salario,
                    i.id_insolvencia,
                    i.terminacion,
                    i.tipo_proceso,
                    i.correcciones,
                    i.creada
                FROM 
                    clientes c
                JOIN 
                    insolvencia i ON c.id_cliente = i.id_cliente
            `);
            return rows;
        } catch (error) {
            console.error('Error al obtener los clientes con DataCrédito:', error);
            throw error;
        }
    },

    updateInsolvenciaData: async ({
        id_cliente,
        correcciones,
        cuadernillo = null,
        fecha_cuadernillo = null,
        radicacion = null,
        fecha_radicacion = null,
        acta_aceptacion = null,
        tipo_proceso = null,
        juzgado = null,
        nombre_liquidador = null,
        telefono_liquidador = null,
        correo_liquidador = null,
        pago_liquidador = null,
        terminacion = null,
        fecha_terminacion = null,
        motivo_insolvencia = null,
        asesor_insolvencia = null,
        autoliquidador = null,
        valor_liquidador = '0',
        cuota_1 = '0',
        cuota_2 = '0',
        cuota_3 = '0',
        cuota_4 = '0',
        fecha_1 = null,
        fecha_2 = null,
        fecha_3 = null,
        fecha_4 = null
    }) => {
        const [result] = await pool.query(`
        UPDATE insolvencia 
        SET 
            correcciones = ?,
            cuadernillo = ?,
            fecha_cuadernillo = ?,
            radicacion = ?,
            fecha_radicacion = ?,
            acta_aceptacion = ?,
            tipo_proceso = ?,
            juzgado = ?,
            nombre_liquidador = ?,
            telefono_liquidador = ?,
            correo_liquidador = ?,
            pago_liquidador = ?,
            terminacion = ?,
            fecha_terminacion = ?,
            motivo_insolvencia = ?,
            asesor_insolvencia = ?,
            autoliquidador = ?,
            valor_liquidador = ?,
            cuota_1 = ?,
            cuota_2 = ?,
            cuota_3 = ?,
            cuota_4 = ?,
            fecha_1 = ?,
            fecha_2 = ?,
            fecha_3 = ?,
            fecha_4 = ?,
            creada = 1
        WHERE id_cliente = ?
    `, [
            correcciones,
            cuadernillo,
            fecha_cuadernillo,
            radicacion,
            fecha_radicacion,
            acta_aceptacion,
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
            autoliquidador,
            valor_liquidador,
            cuota_1,
            cuota_2,
            cuota_3,
            cuota_4,
            fecha_1,
            fecha_2,
            fecha_3,
            fecha_4,
            id_cliente
        ]);

        if (result.affectedRows > 0) {
            const [rows] = await pool.query(`
            SELECT id_insolvencia FROM insolvencia WHERE id_cliente = ?
        `, [id_cliente]);

            return { affectedRows: result.affectedRows, id_insolvencia: rows[0]?.id_insolvencia || null };
        }

        return { affectedRows: 0, id_insolvencia: null };
    },

    insertarAudiencias: async (id_insolvencia, audiencias) => {
        const connection = await pool.getConnection();
        try {
            const values = audiencias.map(a => [a.audiencia, a.fecha_audiencias, id_insolvencia]);
            const insertSql = `
            INSERT INTO audiencias (audiencia, fecha_audiencias, id_insolvencia)
            VALUES ?
        `;
            await connection.query(insertSql, [values]);
        } catch (error) {
            console.error('Error al insertar audiencias:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    insertarDesprendibles: async (id_insolvencia, desprendibles) => {

        const connection = await pool.getConnection();
        try {
            const values = desprendibles.map(d => [
                d.estado_desprendible,
                d.desprendible,
                d.obs_desprendible,
                d.cuota_pagar,
                id_insolvencia
            ]);
            const insertSql = `
        INSERT INTO desprendible 
        (estado_desprendible, desprendible, obs_desprendible, cuota_pagar, id_insolvencia)
        VALUES ?
        `;

            await connection.query(insertSql, [values]);
        } catch (error) {
            console.error('Error al insertar desprendibles:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    getClienteInsolById: async (id_insolvencia) => {
        const connection = await pool.getConnection();

        try {
            const [clienteRows] = await connection.query(`
            SELECT 
                c.id_cliente, 
                c.nombres, 
                c.apellidos, 
                c.cedula, 
                c.correo,
                c.fecha_vinculo,
                c.foto_perfil,
                c.telefono,
                c.direccion,
                c.ciudad,
                c.valor_cuota,
                c.porcentaje,
                c.valor_insolvencia,
                c.numero_cuotas,
                c.salario,
                i.id_insolvencia,
                i.terminacion,
                i.fecha_terminacion,
                i.tipo_proceso,
                i.autoliquidador,
                i.cuadernillo,
                i.fecha_cuadernillo,
                i.radicacion,
                i.fecha_radicacion,
                i.correcciones,
                i.acta_aceptacion,
                i.juzgado,
                i.nombre_liquidador,
                i.telefono_liquidador,
                i.correo_liquidador,
                i.pago_liquidador,
                i.valor_liquidador,
                i.cuota_1,
                i.cuota_2,
                i.cuota_3,
                i.cuota_4,
                i.fecha_1,
                i.fecha_2,
                i.fecha_3,
                i.fecha_4,
                i.motivo_insolvencia,
                i.asesor_insolvencia,
                i.creada,
                d.estado_desprendible,
                d.desprendible AS ruta_desprendible,
                d.obs_desprendible,
                d.cuota_pagar AS cuota_pagar
            FROM 
                clientes c
            JOIN 
                insolvencia i ON c.id_cliente = i.id_cliente
            LEFT JOIN (
                SELECT d.*
                FROM desprendible d
                INNER JOIN (
                    SELECT 
                        id_insolvencia,
                        MAX(id_desprendible) AS max_id
                    FROM 
                        desprendible
                    GROUP BY 
                        id_insolvencia
                ) latest ON d.id_insolvencia = latest.id_insolvencia AND d.id_desprendible = latest.max_id
            ) d ON i.id_insolvencia = d.id_insolvencia
            WHERE 
                i.id_insolvencia = ?
            LIMIT 1
        `, [id_insolvencia]);

            if (clienteRows.length === 0) return null;

            const cliente = clienteRows[0];

            const [audienciasRows] = await connection.query(`
            SELECT 
                audiencia,
                fecha_audiencias
            FROM 
                audiencias
            WHERE 
                id_insolvencia = ?
        `, [id_insolvencia]);

            cliente.audiencias = audienciasRows;

            return cliente;

        } catch (error) {
            console.error('Error en getClienteInsolById:', error);
            throw error;
        } finally {
            connection.release();
        }
    },




};



module.exports = insolvenciaModel;

