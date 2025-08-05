const pool = require('../config/db');

const embargosModel = {
  getAllClienteEmbargos: async () => {
    try {
      const [rows] = await pool.query(`
       SELECT 
            c.id_cliente, 
            c.nombres, 
            c.apellidos, 
            c.cedula, 
            c.foto_perfil,
            e.radicado,
            estado_embargo,
            e.fecha_expediente,
            e.notificar,
            e.id_embargos
        FROM 
            clientes c
        JOIN 
            embargos e ON c.id_cliente = e.id_cliente
        ORDER BY 
            CASE WHEN e.estado_embargo = 1 THEN 0 ELSE 1 END`);
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
        e.id_embargos,
        -- Usa COALESCE: si hay pagaduría la concatena, si no hay, muestra empresa
        COALESCE(GROUP_CONCAT(p.nombre_pagaduria SEPARATOR ', '), c.empresa) AS pagadurias
      FROM 
        clientes c
      JOIN 
        embargos e ON c.id_cliente = e.id_cliente
      LEFT JOIN 
        pagadurias_cliente p ON c.id_cliente = p.id_cliente
      WHERE 
        c.cedula = ?
      GROUP BY 
        c.id_cliente, c.nombres, c.apellidos, c.cedula, c.correo,
        c.fecha_vinculo, c.foto_perfil, c.telefono, c.ciudad, e.id_embargos, c.empresa
      LIMIT 1
      `, [cedula]);

      return rows[0]; // Asumimos que LIMIT 1 traerá solo un registro
    } catch (error) {
      console.error('Error al obtener el cliente por cédula:', error);
      throw error;
    } finally {
      connection.release(); // Muy importante liberar la conexión
    }
  },

  getEmbargoById: async (id_embargos) => {
    try {
      const [rows] = await pool.query(`
              SELECT 
                e.*,
                c.nombres,
                c.apellidos,
                c.cedula,
                c.correo,
                c.telefono,
                c.ciudad,
                c.foto_perfil,
                c.id_cliente,
                c.fecha_vinculo,
                n.fecha_notificacion,
                n.observaciones AS observaciones_alarma
            FROM 
                embargos e
            JOIN 
                clientes c ON e.id_cliente = c.id_cliente
            LEFT JOIN 
                notificaciones_embargos n ON e.id_embargos = n.id_embargos
            WHERE 
                e.id_embargos = ?;
            `, [id_embargos]);

      return rows[0];
    } catch (error) {
      console.error('Error al obtener los datos del embargo:', error);
      throw error;
    }
  },

  // Obtener todos los embargos de un cliente (por si necesitas listarlos)
  getEmbargosByCliente: async (id_cliente) => {
    try {
      const [rows] = await pool.query(`
                SELECT 
                    e.*,
                    c.nombres,
                    c.apellidos,
                    c.cedula
                FROM 
                    embargos e
                JOIN 
                    clientes c ON e.id_cliente = c.id_cliente
                WHERE 
                    e.id_cliente = ?
                ORDER BY 
                    e.fecha_radicacion DESC
            `, [id_cliente]);

      return rows;
    } catch (error) {
      console.error('Error al obtener los embargos del cliente:', error);
      throw error;
    }
  },

  // Actualizar un embargo específico por id_embargos (único)
  updateEmbargo: async (id_embargos, embargoData) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar que el embargo existe
      const [check] = await connection.query(
        'SELECT id_embargos FROM embargos WHERE id_embargos = ?',
        [id_embargos]
      );

      if (check.length === 0) {
        throw new Error('El embargo no existe');
      }

      // Actualizar el embargo
      const [result] = await connection.query(`
                UPDATE embargos 
                SET 
                    valor_embargo = ?,
                    pagaduria_embargo = ?,
                    porcentaje_embargo = ?,
                    juzgado_embargo = ?,
                    fecha_radicacion = ?,
                    fecha_expediente = ?,
                    fecha_revision_exp = ?,
                    red_judicial = ?,
                    subsanaciones = ?,
                    estado_embargo = ?,
                    radicado = ?,
                    asesor_embargo = ?,
                    creada = 1,
                    notificar = 0,
                    updated_at = NOW()
                WHERE 
                    id_embargos = ?
            `, [
        embargoData.valor_embargo,
        embargoData.pagaduria_embargo,
        embargoData.porcentaje_embargo,
        embargoData.juzgado_embargo,
        embargoData.fecha_radicacion,
        embargoData.fecha_expediente,
        embargoData.fecha_revision_exp,
        embargoData.red_judicial,
        embargoData.subsanaciones,
        embargoData.estado_embargo,
        embargoData.radicado,
        embargoData.asesor_embargo,
        id_embargos
      ]);

      await connection.commit();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error al actualizar el embargo:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  getAllClienteEmbargosAceptados: async () => {
    try {
      const [rows] = await pool.query(`
       SELECT 
            c.id_cliente, 
            c.nombres, 
            c.apellidos, 
            c.cedula, 
            c.foto_perfil,
            e.radicado,
            e.estado_embargo,
            e.fecha_expediente,
            e.id_embargos,
            e.ruta_desprendible,
            e.fecha_terminacion
        FROM 
            clientes c
        JOIN 
            embargos e ON c.id_cliente = e.id_cliente
        WHERE
            e.estado_embargo = 0`);
      return rows;
    } catch (error) {
      console.error('Error al obtener los clientes con Embargos Aceptados:', error);
      throw error;
    }
  },

  saveDocumentData: async (idEmbargo, rutaDocumento, fechaDesprendible, fechaTerminacion, estadoEmbargo) => {
    try {
      const sql = `
      UPDATE embargos 
      SET ruta_desprendible = ?, 
          fecha_desprendible = ?, 
          fecha_terminacion = ?, 
          estado_embargo = ?
      WHERE id_embargos = ?
    `;

      console.log('🟡 Ejecutando SQL:');
      console.log(sql);
      console.log('📦 Valores:', [
        rutaDocumento,
        fechaDesprendible,
        fechaTerminacion,
        estadoEmbargo,
        idEmbargo
      ]);

      await pool.query(sql, [
        rutaDocumento,
        fechaDesprendible,
        fechaTerminacion,
        estadoEmbargo,
        idEmbargo
      ]);

    } catch (error) {
      console.error('Error al guardar documento desprendible:', error);
      throw error;
    }
  },

  verificarEmbargosPorCliente: async (id_cliente) => {
    const [rows] = await pool.query('SELECT * FROM embargos WHERE id_cliente = ?', [id_cliente]);
    return rows;
  },

  insertarEmbargo: async (embargoData, updateEmbargoFn) => {
    const connection = await pool.getConnection();
    try {
      // 1. Verificar si ya hay un embargo con creada = 1
      const [existente] = await connection.query(`
            SELECT id_embargos 
            FROM embargos 
            WHERE id_cliente = ? AND creada = 1
            LIMIT 1
        `, [embargoData.id_cliente]);

      if (existente.length > 0) {
        // 2. Si existe, insertar uno nuevo
        const [result] = await connection.query(`
                INSERT INTO embargos (
                    id_cliente,
                    valor_embargo,
                    pagaduria_embargo,
                    porcentaje_embargo,
                    juzgado_embargo,
                    fecha_radicacion,
                    fecha_expediente,
                    fecha_revision_exp,
                    red_judicial,
                    subsanaciones,
                    estado_embargo,
                    radicado,
                    asesor_embargo,
                    creada,
                    notificar,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NOW())
            `, [
          embargoData.id_cliente,
          embargoData.valor_embargo,
          embargoData.pagaduria_embargo,
          embargoData.porcentaje_embargo,
          embargoData.juzgado_embargo,
          embargoData.fecha_radicacion,
          embargoData.fecha_expediente,
          embargoData.fecha_revision_exp,
          embargoData.red_judicial,
          embargoData.subsanaciones,
          embargoData.estado_embargo,
          embargoData.radicado,
          embargoData.asesor_embargo
        ]);

        return { action: 'insert', id: result.insertId };
      } else {
        // 3. Si NO existe, buscar el embargo más reciente para actualizarlo
        const [ultimos] = await connection.query(`
                SELECT id_embargos 
                FROM embargos 
                WHERE id_cliente = ? 
                ORDER BY updated_at DESC 
                LIMIT 1
            `, [embargoData.id_cliente]);

        if (ultimos.length === 0) {
          // 4. Si no hay ningún embargo existente, crear uno nuevo
          const [result] = await connection.query(`
                    INSERT INTO embargos (
                        id_cliente,
                        valor_embargo,
                        pagaduria_embargo,
                        porcentaje_embargo,
                        juzgado_embargo,
                        fecha_radicacion,
                        fecha_expediente,
                        fecha_revision_exp,
                        red_judicial,
                        subsanaciones,
                        estado_embargo,
                        radicado,
                        asesor_embargo,
                        creada,
                        notificar,
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NOW())
                `, [
            embargoData.id_cliente,
            embargoData.valor_embargo,
            embargoData.pagaduria_embargo,
            embargoData.porcentaje_embargo,
            embargoData.juzgado_embargo,
            embargoData.fecha_radicacion,
            embargoData.fecha_expediente,
            embargoData.fecha_revision_exp,
            embargoData.red_judicial,
            embargoData.subsanaciones,
            embargoData.estado_embargo,
            embargoData.radicado,
            embargoData.asesor_embargo
          ]);

          return { action: 'insert', id: result.insertId };
        }

        const idActualizar = ultimos[0].id_embargos;
        const actualizado = await updateEmbargoFn(idActualizar, embargoData);
        return { action: 'update', id: idActualizar, updated: actualizado };
      }
    } catch (error) {
      console.error('Error en insertarEmbargo:', error);
      throw error;
    } finally {
      connection.release();
    }
  },

  actualizarNotificar: async (id_embargos, valorNotificar) => {
    try {
      const [result] = await pool.query(
        'UPDATE embargos SET notificar = ? WHERE id_embargos = ?',
        [valorNotificar, id_embargos]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar el campo notificar:', error);
      throw error;
    }
  },




};

module.exports = embargosModel;