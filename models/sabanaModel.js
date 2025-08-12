const db = require('../config/db'); // tu conexión MySQL

const Sabana = {
    guardar: async (ruta, usuario, fecha) => {
        const sql = `
            INSERT INTO sabana (sabana_ruta, usuario_sabana, fecha_sabana) 
            VALUES (?, ?, ?)
        `;
        const [result] = await db.query(sql, [ruta, usuario, fecha]);
        return result;
    },
    listarFechasUsuarios: async () => {
        const sql = `
            SELECT fecha_sabana, usuario_sabana
            FROM sabana
            ORDER BY fecha_sabana DESC
        `;
        const [results] = await db.query(sql);
        return results;
    }
};

module.exports = Sabana;
