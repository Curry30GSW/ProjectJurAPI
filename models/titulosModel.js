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
        t.creado,
        t.t_ofic_noti,
        t.f_juz_noti
    FROM embargos e
    INNER JOIN clientes c 
        ON e.id_cliente = c.id_cliente
    LEFT JOIN titulos t
        ON e.id_embargos = t.id_embargos
    WHERE e.titulos = 1;

`);
    return rows;
  },

  insertTitulo: async (datos) => {
    const {
      terminacion_ofic,
      terminacion_oficpdf,
      terminacion_juzg,
      terminacion_juzgpdf,
      solicitud_titulos,
      orden_pago,
      orden_pagopdf,
      asesor_titulos,
      id_embargos,
      t_ofic_noti,
      f_juz_noti
    } = datos;

    const query = `
    INSERT INTO titulos (
      terminacion_ofic,
      terminacion_oficpdf,
      terminacion_juzg,
      terminacion_juzgpdf,
      solicitud_titulos,
      orden_pago,
      orden_pagopdf,
      asesor_titulos,
      id_embargos,
      t_ofic_noti,    
      f_juz_noti,      
      creado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

    const [result] = await pool.query(query, [
      terminacion_ofic,
      terminacion_oficpdf,
      terminacion_juzg,
      terminacion_juzgpdf,
      solicitud_titulos,
      orden_pago,
      orden_pagopdf,
      asesor_titulos,
      id_embargos,
      t_ofic_noti,
      f_juz_noti
    ]);

    return result;
  },


  obtenerDatosPorEmbargo: async (id_embargos) => {
    const sql = `
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
      t.terminacion_ofic,
      t.terminacion_oficpdf,
      t.terminacion_juzg,
      t.terminacion_juzgpdf,
      t.solicitud_titulos,
      t.orden_pago,
      t.orden_pagopdf,
      t.asesor_titulos
    FROM embargos e
    INNER JOIN clientes c ON e.id_cliente = c.id_cliente
    LEFT JOIN titulos t ON t.id_embargos = e.id_embargos
    WHERE e.id_embargos = ?
      AND e.titulos = 1
  `;

    const [rows] = await pool.query(sql, [id_embargos]);
    return rows;
  },

  updateTitulo: async (datos) => {
    const {
      terminacion_ofic,
      terminacion_oficpdf,
      terminacion_juzg,
      terminacion_juzgpdf,
      solicitud_titulos,
      orden_pago,
      orden_pagopdf,
      id_embargos,
      t_ofic_noti,
      f_juz_noti
    } = datos;

    const query = `
    UPDATE titulos SET
      terminacion_ofic = ?,
      terminacion_oficpdf = ?,
      terminacion_juzg = ?,
      terminacion_juzgpdf = ?,
      solicitud_titulos = ?,
      orden_pago = ?,
      orden_pagopdf = ?,
      t_ofic_noti = ?,
      f_juz_noti = ? 
    WHERE id_embargos = ?
  `;

    const [result] = await pool.query(query, [
      terminacion_ofic,
      terminacion_oficpdf,
      terminacion_juzg,
      terminacion_juzgpdf,
      solicitud_titulos,
      orden_pago,
      orden_pagopdf,
      t_ofic_noti,
      f_juz_noti,
      id_embargos
    ]);


    return result;
  },

  obtenerPorId: async (id_embargos) => {
    try {
      const [rows] = await pool.query('SELECT * FROM titulos WHERE id_embargos = ?', [id_embargos]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error al obtener título por ID:', error);
      throw error;
    }
  },

};


module.exports = TitulosModel;
