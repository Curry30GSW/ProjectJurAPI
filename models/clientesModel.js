const pool = require('../config/db');

async function handleReferencias(connection, id_cliente, tabla, referencias, getValuesFn, columnas, idField) {
  if (!Array.isArray(referencias)) return;

  for (const referencia of referencias) {
    const id_referencia = referencia[idField];

    // Si existe el id_referencia, actualiza
    if (id_referencia) {
      const campos = columnas.map(col => `${col} = ?`).join(', ');
      const valores = getValuesFn(referencia);
      await connection.query(
        `UPDATE ${tabla} SET ${campos} WHERE ${idField} = ?`,
        [...valores, id_referencia]
      );
    } else {
      // Si no existe, inserta nuevo
      const valores = getValuesFn(referencia);
      await connection.query(
        `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
        valores
      );
    }
  }
}



const ClienteModel = {

  getAllClientes: async () => {
    const [rows] = await pool.query('SELECT * FROM clientes');
    return rows;
  },

  insertCliente: async (clienteData) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Verificar si la cédula ya existe
      const cedulaExistQuery = `
            SELECT COUNT(*) AS count FROM clientes WHERE cedula = ?
        `;
      const [existingCedula] = await connection.query(cedulaExistQuery, [clienteData.cedula]);

      if (existingCedula[0].count > 0) {
        // La cédula ya existe, lanzar alert en el frontend
        throw new Error('Ya existe un cliente con esa cédula');
      }


      const limpiarValorMonetario = (valor) => {
        if (valor === null || valor === undefined) return null;
        if (typeof valor === 'number') return valor;
        return parseInt(valor.toString().replace(/[^\d]/g, '')) || null;
      };

      const limpiarPorcentaje = (valor) => {
        if (valor === null || valor === undefined) return null;
        if (typeof valor === 'number') return valor;
        return parseFloat(valor.toString().replace(',', '.').replace(/[^\d.]/g, '')) || null;
      };

      // Insertar cliente principal
      const clienteQuery = `
        INSERT INTO clientes (
            nombres, apellidos, cedula, cedula_pdf, direccion, telefono, sexo, fecha_nac,
            edad, ciudad, correo, barrio, estado_civil, laboral, empresa, cargo, 
            salario, desprendible, bienes, asesor, foto_perfil, bienes_inmuebles,
            valor_cuota, porcentaje, valor_insolvencia, numero_cuotas, recibos_publicos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

      if (clienteData.bienes === 'no') {
        clienteData.bienes_inmuebles = 'NO APLICA';
      }

      const clienteValues = [
        clienteData.nombres || null,
        clienteData.apellidos || null,
        clienteData.cedula ? parseInt(clienteData.cedula) : null,
        clienteData.cedula_pdf || null,
        clienteData.direccion || null,
        clienteData.telefono || null,
        clienteData.sexo || null,
        clienteData.fechaNacimiento || null,
        clienteData.edad ? parseInt(clienteData.edad) : null,
        clienteData.ciudad || null,
        clienteData.correo || null,
        clienteData.barrio || null,
        clienteData.estado_civil || null,
        clienteData.laboral,
        clienteData.empresa || 'NO APLICA',
        clienteData.cargo || 'NO APLICA',
        clienteData.salario ? parseInt(clienteData.salario) : null,
        clienteData.desprendible || null,
        clienteData.bienes === 'si' ? 1 : 0,
        clienteData.asesor || null,
        clienteData.foto_perfil || null,
        clienteData.bienes_inmuebles && clienteData.bienes_inmuebles.trim() !== ''
          ? clienteData.bienes_inmuebles
          : 'NO APLICA',
        limpiarValorMonetario(clienteData.valor_cuota),
        limpiarPorcentaje(clienteData.porcentaje),
        limpiarValorMonetario(clienteData.valor_insolvencia),
        clienteData.numero_cuotas ? parseInt(clienteData.numero_cuotas) : null,
        clienteData.recibos_publicos || null,
      ];

      const [result] = await connection.query(clienteQuery, clienteValues);
      const id_cliente = result.insertId;
      await connection.query(
        `INSERT INTO datacredito (id_cliente, nombreData) VALUES (?, ?)`,
        [id_cliente, '']
      );

      if (Array.isArray(clienteData.pagadurias) && clienteData.pagadurias.length > 0) {
        for (const pag of clienteData.pagadurias) {
          await connection.query(
            `INSERT INTO pagadurias_cliente (id_cliente, nombre_pagaduria, valor_pagaduria, descuento_pagaduria)
       VALUES (?, ?, ?, ?)`,
            [
              id_cliente,
              pag.nombre,
              limpiarValorMonetario(pag.valor),
              limpiarPorcentaje(pag.descuento)
            ]
          );
        }
      }

      // Insertar referencias personales
      for (const ref of clienteData.referencias_personales) {
        await connection.query(
          `INSERT INTO referencias_personales 
                    (id_cliente, personal_nombre, personal_telefono) 
                    VALUES (?, ?, ?)`,
          [id_cliente, ref.personal_nombre, ref.personal_telefono]
        );
      }

      // Insertar referencias familiares
      for (const ref of clienteData.referencias_familiares) {
        await connection.query(
          `INSERT INTO referencias_familiares 
                    (id_cliente, familia_nombre, familia_telefono, parentesco) 
                    VALUES (?, ?, ?, ?)`,
          [id_cliente, ref.familia_nombre, ref.familia_telefono, ref.parentesco]
        );
      }

      await connection.commit();
      return { id_cliente };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  buscarPorCedula: async (cedula) => {
    const connection = await pool.getConnection();
    try {
      // Obtener datos del cliente y datacrédito
      const [clienteRows] = await connection.query(
        `SELECT 
          c.*, 
          d.nombreData,
          GROUP_CONCAT(p.nombre_pagaduria SEPARATOR ', ') AS pagadurias
      FROM clientes c
      LEFT JOIN datacredito d 
          ON c.id_cliente = d.id_cliente
      LEFT JOIN pagadurias_cliente p 
          ON c.id_cliente = p.id_cliente
      WHERE c.cedula = ?
      GROUP BY c.id_cliente;`,
        [cedula]
      );

      if (clienteRows.length === 0) {
        return null;
      }

      const cliente = clienteRows[0];

      // Obtener referencias familiares
      const [familiaresRows] = await connection.query(
        'SELECT * FROM referencias_familiares WHERE id_cliente = ?',
        [cliente.id_cliente]
      );

      // Obtener referencias personales
      const [personalesRows] = await connection.query(
        'SELECT * FROM referencias_personales WHERE id_cliente = ?',
        [cliente.id_cliente]
      );

      // ✅ Obtener pagadurías del cliente
      const [pagaduriasRows] = await connection.query(
        `SELECT nombre_pagaduria, valor_pagaduria, descuento_pagaduria 
       FROM pagadurias_cliente 
       WHERE id_cliente = ?`,
        [cliente.id_cliente]
      );

      // Agregar al objeto del cliente
      cliente.referencias_familiares = familiaresRows;
      cliente.referencias_personales = personalesRows;
      cliente.pagadurias = pagaduriasRows; // puedes usar otro nombre si prefieres

      return cliente;

    } catch (error) {
      throw error;
    } finally {
      connection.release();
    }
  },


  updateCliente: async (cedula, clienteData) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Buscar ID del cliente
      const [rows] = await connection.query(
        'SELECT id_cliente FROM clientes WHERE cedula = ?',
        [cedula]
      );

      if (rows.length === 0) {
        throw new Error('Cliente no encontrado');
      }

      const id_cliente = rows[0].id_cliente;

      // Construir consulta dinámica para actualizar solo los campos proporcionados
      const fieldsToUpdate = [];
      const valuesToUpdate = [];

      // Mapeo de campos
      const fieldMap = {
        nombres: clienteData.nombres,
        apellidos: clienteData.apellidos,
        telefono: clienteData.telefono,
        correo: clienteData.correo,
        direccion: clienteData.direccion,
        ciudad: clienteData.ciudad,
        barrio: clienteData.barrio,
        estado_civil: clienteData.estado_civil,
        estado: clienteData.estado !== undefined ? parseInt(clienteData.estado) : undefined,
        motivo_retiro: clienteData.motivo_retiro || null, // 
        laboral: clienteData.laboral || 'NO APLICA',
        empresa: clienteData.empresa || 'NO APLICA',
        cargo: clienteData.cargo || 'NO APLICA',
        salario: clienteData.salario ? parseInt(clienteData.salario) : null,
        desprendible: clienteData.desprendible,
        bienes: clienteData.bienes_inmuebles === 'si' ? 1 : 0,
        foto_perfil: clienteData.foto_perfil,
        cedula_pdf: clienteData.cedula_pdf,
        fecha_nac: clienteData.fecha_nacimiento || null,
        edad: clienteData.edad ? parseInt(clienteData.edad) : null,
        valor_cuota: clienteData.cuota ? parseInt(clienteData.cuota) : null,
        porcentaje: clienteData.porcentaje ? parseFloat(clienteData.porcentaje) : null,
        valor_insolvencia: clienteData.valor_insolvencia ? parseInt(clienteData.valor_insolvencia) : null,
        numero_cuotas: clienteData.numero_cuotas ? parseInt(clienteData.numero_cuotas) : null
      };

      // Construir partes de la consulta dinámicamente
      for (const [field, value] of Object.entries(fieldMap)) {
        if (value !== undefined && value !== null) {
          fieldsToUpdate.push(`${field} = ?`);
          valuesToUpdate.push(value);
        }
      }

      // Solo actualizar si hay campos para actualizar
      if (fieldsToUpdate.length > 0) {
        const updateQuery = `UPDATE clientes SET ${fieldsToUpdate.join(', ')} WHERE cedula = ?`;
        await connection.query(updateQuery, [...valuesToUpdate, parseInt(cedula)]);
      }

      // Manejo de referencias (mejorado)
      await handleReferencias(
        connection,
        id_cliente,
        'referencias_personales',
        clienteData.referencias_personales,
        (ref) => [id_cliente, ref.personal_nombre, ref.personal_telefono],
        ['id_cliente', 'personal_nombre', 'personal_telefono'],
        'id_referenciaPe'
      );

      await handleReferencias(
        connection,
        id_cliente,
        'referencias_familiares',
        clienteData.referencias_familiares,
        (ref) => [id_cliente, ref.familia_nombre, ref.familia_telefono, ref.parentesco],
        ['id_cliente', 'familia_nombre', 'familia_telefono', 'parentesco'],
        'id_referenciaFa'
      );

      // Guardar pagadurías del cliente si existen
      if (Array.isArray(clienteData.pagadurias)) {
        // Eliminar todas las pagadurías actuales del cliente
        await connection.query('DELETE FROM pagadurias_cliente WHERE id_cliente = ?', [id_cliente]);

        // Insertar todas las nuevas pagadurías enviadas desde el frontend
        for (const pagaduria of clienteData.pagadurias) {
          const { nombre, valor, descuento } = pagaduria;

          if (nombre && valor != null) {
            await connection.query(
              `INSERT INTO pagadurias_cliente 
          (id_cliente, nombre_pagaduria, valor_pagaduria, descuento_pagaduria)
         VALUES (?, ?, ?, ?)`,
              [
                id_cliente,
                nombre,
                parseInt(valor),
                descuento !== undefined ? parseFloat(descuento) : 0.0
              ]
            );
          }
        }
      }


      await connection.commit();
      return { message: 'Cliente actualizado exitosamente' };
    } catch (error) {
      try {
        if (connection) await connection.rollback();
      } catch (rollbackError) {
        console.error('Error durante rollback:', rollbackError.message);
      }
      throw error;
    } finally {
      if (connection) connection.release();
    }
  },

  getConteoPorPagaduria: async () => {
    const [rows] = await pool.query(`
    SELECT nombre_pagaduria, COUNT(*) AS cantidad
    FROM pagadurias_cliente
    GROUP BY nombre_pagaduria
  `);
    return rows;
  },

  getClientesPorPagaduria: async (nombrePagaduria) => {
    const pagaduriasPrincipales = [
      'colpensiones',
      'fopep',
      'fiduprevisora',
      'porvenir',
      'seguros alfa',
      'secretaria educacion'
    ];

    let query = '';
    let params = [];

    if (nombrePagaduria.toLowerCase() === 'otras') {
      query = `
      SELECT c.*, 
             p.nombre_pagaduria AS pagaduria,
             p.valor_pagaduria
      FROM clientes c
      INNER JOIN pagadurias_cliente p ON c.id_cliente = p.id_cliente
      WHERE LOWER(p.nombre_pagaduria) NOT IN (${pagaduriasPrincipales.map(() => '?').join(', ')});
    `;
      params = pagaduriasPrincipales;
    } else {
      query = `
      SELECT c.*, 
             p.nombre_pagaduria AS pagaduria,
             p.valor_pagaduria
      FROM clientes c
      INNER JOIN pagadurias_cliente p ON c.id_cliente = p.id_cliente
      WHERE LOWER(p.nombre_pagaduria) = ?;
    `;
      params = [nombrePagaduria.toLowerCase()];
    }

    const [rows] = await pool.query(query, params);
    return rows;
  },



};


module.exports = ClienteModel;
