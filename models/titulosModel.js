const pool = require('../config/db');


const TitulosModel = {

    getAllTitulos: async () => {
        const [rows] = await pool.query(`
    SELECT 
      c.cedula,
      c.nombres,
      c.apellidos,
      c.foto_perfil,
      c.telefono,
      c.correo,
      c.ciudad,
      e.id_embargos,
      e.radicado,
      e.ruta_desprendible,
      e.fecha_terminacion
    FROM embargos e
    INNER JOIN clientes c ON e.id_cliente = c.id_cliente
    WHERE e.fecha_terminacion IS NOT NULL
      AND e.fecha_terminacion >= CURRENT_DATE`);
        return rows;
    },

};


module.exports = TitulosModel;
