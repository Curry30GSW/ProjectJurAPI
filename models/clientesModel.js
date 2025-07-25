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
            valor_cuota, porcentaje, valor_insolvencia, numero_cuotas 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        clienteData.numero_cuotas ? parseInt(clienteData.numero_cuotas) : null
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
      const [clienteRows] = await connection.query(
        `SELECT clientes.*, datacredito.nombreData
          FROM clientes
          LEFT JOIN datacredito ON clientes.id_cliente = datacredito.id_cliente
          WHERE clientes.cedula = ?`,
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

      // Agregar al objeto del cliente
      cliente.referencias_familiares = familiaresRows;
      cliente.referencias_personales = personalesRows;

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
        pagaduria: clienteData.pagaduria || 'NO APLICA',
        salario: clienteData.salario ? parseInt(clienteData.salario) : null,
        desprendible: clienteData.desprendible,
        bienes: clienteData.bienes_inmuebles === 'si' ? 1 : 0,
        foto_perfil: clienteData.foto_perfil,
        cedula_pdf: clienteData.cedula_pdf
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

};


module.exports = ClienteModel;
