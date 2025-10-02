const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const UserModel = {

    authenticate: async (usuario, password) => {
        try {
            const query = `
      SELECT name, user, password, rol, activo
      FROM users 
      WHERE LOWER(TRIM(user)) = LOWER(TRIM(?))
    `;

            const [users] = await pool.query(query, [usuario]);

            if (users.length === 0) {
                return { status: "error", message: "Usuario no encontrado" };
            }

            const user = users[0];

            if (user.activo !== 1) {
                return { status: "error", message: "Usuario inactivo" };
            }


            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return { status: "error", message: "Contraseña incorrecta" };
            }

            return { status: "success", message: "Autenticación exitosa", user };

        } catch (error) {
            console.error("❌ Error en la autenticación:", error);
            throw error;
        }
    },



    registrarAuditoria: async ({ user, rol, ip_usuario, detalle_actividad }) => {
        try {
            const query = `
        INSERT INTO cei_auditoria 
        (user, rol, ip_usuario, hora_acceso, detalle_actividad) 
        VALUES (?, ?, ?, NOW(), ?)
      `;
            await pool.query(query, [user, rol, ip_usuario, detalle_actividad]);
        } catch (error) {
            console.error("❌ Error registrando auditoría:", error);
            throw error;
        }
    }

};

module.exports = UserModel;
