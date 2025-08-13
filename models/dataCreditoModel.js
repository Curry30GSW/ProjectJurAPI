const pool = require('../config/db');

const dataCreditoModel = {
    getAllClienteData: async () => {
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
                    d.nombreData
                FROM 
                    clientes c
                JOIN 
                    datacredito d ON c.id_cliente = d.id_cliente
            `);
            return rows;
        } catch (error) {
            console.error('Error al obtener los clientes con DataCrédito:', error);
            throw error;
        }
    },
    saveDocumentData: async (cedula, rutaDocumento, fechaAdjunto, usuario) => {
        try {
            // Obtener el ID del cliente usando la cédula
            const [cliente] = await pool.query('SELECT id_cliente FROM clientes WHERE cedula = ?', [cedula]);

            if (cliente.length === 0) {
                throw new Error('No se encontró un cliente con esa cédula.');
            }

            const idCliente = cliente[0].id_cliente;

            // Actualizar tabla datacredito
            const sql = `
            UPDATE datacredito 
            SET nombreData = ?, fecha_data = ?, usuario_data = ?
            WHERE id_cliente = ?
        `;
            await pool.query(sql, [rutaDocumento, fechaAdjunto, usuario, idCliente]);

        } catch (error) {
            console.error('Error al guardar documento DataCrédito:', error);
            throw error;
        }
    },

    moveAreaClient: async (cedula, nuevaArea, usuario) => {
        try {
            // Buscar al cliente por cédula
            const [clientes] = await pool.query('SELECT id_cliente FROM clientes WHERE cedula = ?', [cedula]);

            if (clientes.length === 0) {
                throw new Error('No se encontró un cliente con esa cédula.');
            }

            const idCliente = clientes[0].id_cliente;

            const ahora = new Date();
            const fecha = new Date(ahora.getTime() - 5 * 60 * 60 * 1000)
                .toISOString().slice(0, 19).replace('T', ' ');

            // Verifica si ya existe un registro en datacredito para ese cliente
            const [existeData] = await pool.query('SELECT id_cliente FROM datacredito WHERE id_cliente = ?', [idCliente]);

            if (existeData.length === 0) {
                await pool.query(`
                INSERT INTO datacredito (nombreData, id_cliente, fecha_data, usuario_data, area_actual)
                VALUES (?, ?, ?, ?, ?)
            `, ['Cambio de área', idCliente, fecha, usuario, nuevaArea]);
            }

            await pool.query(`
            UPDATE datacredito SET area_actual = ? WHERE id_cliente = ?
        `, [nuevaArea, idCliente]);


            const area = nuevaArea.trim().toUpperCase();


            if (area === 'CREDITOS') {
                const [yaExiste] = await pool.query('SELECT id_cliente FROM creditos WHERE id_cliente = ?', [idCliente]);
                if (yaExiste.length > 0) {
                    throw new Error(`El cliente ya está en el área ${area}`);
                }
                await pool.query('INSERT INTO creditos (id_cliente) VALUES (?)', [idCliente]);

            } else if (area === 'EMBARGOS') {
                const [yaExiste] = await pool.query('SELECT id_cliente FROM embargos WHERE id_cliente = ?', [idCliente]);
                if (yaExiste.length > 0) {
                    throw new Error(`El cliente ya está en el área ${area}`);
                }
                await pool.query('INSERT INTO embargos (id_cliente) VALUES (?)', [idCliente]);

            } else if (area === 'INSOLVENCIAS') {
                const [yaExiste] = await pool.query('SELECT id_cliente FROM insolvencia WHERE id_cliente = ?', [idCliente]);
                if (yaExiste.length > 0) {
                    throw new Error(`El cliente ya está en el área ${area}`);
                }
                await pool.query('INSERT INTO insolvencia (id_cliente) VALUES (?)', [idCliente]);
            }

            // Obtener nombre del cliente para mostrarlo en notificación
            const [datosCliente] = await pool.query('SELECT nombres FROM clientes WHERE id_cliente = ?', [idCliente]);
            const nombreCliente = datosCliente.length > 0 ? datosCliente[0].nombres : 'Cliente';

            // Guardar en historial
            await pool.query(`
            INSERT INTO historial_movimientos (id_cliente, nombre_cliente, area_destino, usuario, fecha_movimiento)
            VALUES (?, ?, ?, ?, ?)
        `, [idCliente, nombreCliente, area, usuario, fecha]);

            return nombreCliente;

        } catch (error) {
            // console.error('Error en moverArea:', error);
            throw error;
        }
    },


    obtenerUltimasNotificaciones: async () => {
        const [resultados] = await pool.query(`
            SELECT nombre_cliente, area_destino, usuario, 
                   DATE_FORMAT(fecha_movimiento, '%d %b %h:%i %p') AS fecha_formateada
            FROM historial_movimientos
            ORDER BY fecha_movimiento DESC
            LIMIT 5
        `);
        return resultados;
    }
};



module.exports = dataCreditoModel;
