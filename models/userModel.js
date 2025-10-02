const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const UserModel = {
    // Crear usuario
    create: async ({ name, user, email, password, rol }) => {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const query = `
                INSERT INTO users (name, user, email, password, rol, activo)
                VALUES (?, ?, ?, ?, ?, 1)
            `;
            const [result] = await pool.query(query, [name, user, email, hashedPassword, rol]);
            return { status: "success", insertId: result.insertId };
        } catch (error) {
            console.error("❌ Error creando usuario:", error);
            throw error;
        }
    },

    // Actualizar usuario
    update: async (id, { name, user, email, password, rol }) => {
        try {
            let query = `UPDATE users SET name=?, user=?, email=?, rol=?`;
            const params = [name, user, email, rol];

            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query += `, password=?`;
                params.push(hashedPassword);
            }

            query += ` WHERE id_usuario=?`;
            params.push(id);

            await pool.query(query, params);
            return { status: "success", message: "Usuario actualizado correctamente" };
        } catch (error) {
            console.error("❌ Error actualizando usuario:", error);
            throw error;
        }
    },

    // Habilitar usuario
    enable: async (id) => {
        try {
            const query = `UPDATE users SET activo=1 WHERE id_usuario=?`;
            await pool.query(query, [id]);
            return { status: "success", message: "Usuario habilitado correctamente" };
        } catch (error) {
            console.error("❌ Error habilitando usuario:", error);
            throw error;
        }
    },


    // Inhabilitar usuario
    disable: async (id) => {
        try {
            const query = `UPDATE users SET activo=0 WHERE id_usuario=?`;
            await pool.query(query, [id]);
            return { status: "success", message: "Usuario inhabilitado correctamente" };
        } catch (error) {
            console.error("❌ Error inhabilitando usuario:", error);
            throw error;
        }
    },

    // Listar todos
    getAll: async () => {
        try {
            const query = `
                SELECT id_usuario, name, user, email, rol, activo
                FROM users
            `;
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            console.error("❌ Error listando usuarios:", error);
            throw error;
        }
    },

    getAllUser: async () => {
        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`
       SELECT 
        u.id_usuario, 
        u.name, 
        u.user,
        u.email,
        u.rol,
        u.activo
      FROM 
        users u
      WHERE 
        u.activo = 1
    
     
      `);

            return rows;
        } catch (error) {
            console.error('Error al obtener el usuario por id:', error);
            throw error;
        } finally {
            connection.release();
        }
    },

    getById: async (id) => {
        try {
            const [rows] = await pool.query(
                "SELECT id_usuario, name, user, email, rol, activo FROM users WHERE id_usuario = ?",
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("❌ Error obteniendo usuario por ID:", error);
            throw error;
        }
    },

};

module.exports = UserModel;
