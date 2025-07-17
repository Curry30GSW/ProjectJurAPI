
const pool = require('../config/db');

class Notificacion {
    static async create(fecha_notificacion, observaciones, asesor_notificacion, id_embargos) {
        try {
            const [result] = await pool.query(
                'INSERT INTO notificaciones_embargos (fecha_notificacion, observaciones, asesor_notificacion, id_embargos) VALUES (?, ?, ?, ?)',
                [fecha_notificacion, observaciones, asesor_notificacion, id_embargos]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error al crear notificación: ${error.message}`);
        }
    }

    static async findByEmbargoId(id_embargos) {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM notificaciones_embargos WHERE id_embargos = ? ORDER BY fecha_notificacion DESC',
                [id_embargos]
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al buscar notificaciones: ${error.message}`);
        }
    }

    static async findAll() {
        try {
            const [rows] = await pool.query(
                `SELECT 
                n.*,
                e.id_cliente,
                c.nombres,
                c.apellidos,
                c.cedula,
                e.radicado,
                e.fecha_expediente
            FROM notificaciones_embargos n
            JOIN embargos e ON n.id_embargos = e.id_embargos
            JOIN clientes c ON e.id_cliente = c.id_cliente
            ORDER BY n.fecha_notificacion DESC`
            );
            return rows;
        } catch (error) {
            throw new Error(`Error al obtener todas las notificaciones: ${error.message}`);
        }
    }

    static async updateFechaById(id_notificacion, nueva_fecha) {
        try {
            const [result] = await pool.query(
                'UPDATE notificaciones_embargos SET fecha_notificacion = ? WHERE id_notificacion = ?',
                [nueva_fecha, id_notificacion]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar la fecha: ${error.message}`);
        }
    }

    static async createOrUpdate(fecha_notificacion, observaciones, asesor_notificacion, id_embargos) {
        try {
            const [rows] = await pool.query(
                'SELECT id_notificacion FROM notificaciones_embargos WHERE id_embargos = ?',
                [id_embargos]
            );

            if (rows.length > 0) {
                const id_notificacion = rows[0].id_notificacion;

                const [result] = await pool.query(
                    'UPDATE notificaciones_embargos SET fecha_notificacion = ?, observaciones = ?, asesor_notificacion = ? WHERE id_notificacion = ?',
                    [fecha_notificacion, observaciones, asesor_notificacion, id_notificacion]
                );

                return { updated: true, id_notificacion };
            } else {
                // No existe: crear nueva
                const [result] = await pool.query(
                    'INSERT INTO notificaciones_embargos (fecha_notificacion, observaciones, asesor_notificacion, id_embargos) VALUES (?, ?, ?, ?)',
                    [fecha_notificacion, observaciones, asesor_notificacion, id_embargos]
                );

                return { created: true, id_notificacion: result.insertId };
            }
        } catch (error) {
            throw new Error(`Error al crear o actualizar notificación: ${error.message}`);
        }
    }



}

module.exports = Notificacion;