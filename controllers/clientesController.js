const ClienteModel = require('../models/clientesModel');
const fs = require('fs');
const path = require('path');

const ClienteController = {

  listarClientes: async (req, res) => {
    try {
      const clientes = await ClienteModel.getAllClientes();
      res.json(clientes);
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  },

  agregarCliente: async (req, res) => {
    try {
      // 1. Manejo seguro de referencias
      let referencias_personales = [];
      let referencias_familiares = [];

      try {
        referencias_personales = req.body.referencias_personales
          ? typeof req.body.referencias_personales === 'string'
            ? JSON.parse(req.body.referencias_personales)
            : req.body.referencias_personales
          : [];

        referencias_familiares = req.body.referencias_familiares
          ? typeof req.body.referencias_familiares === 'string'
            ? JSON.parse(req.body.referencias_familiares)
            : req.body.referencias_familiares
          : [];
      } catch (parseError) {
        console.error('Error parseando referencias:', parseError);
        throw new Error('Formato incorrecto en referencias');
      }

      let pagadurias = [];

      try {
        pagadurias = req.body.pagadurias
          ? typeof req.body.pagadurias === 'string'
            ? JSON.parse(req.body.pagadurias)
            : req.body.pagadurias
          : [];
      } catch (err) {
        console.error('Error parseando pagadurías:', err);
        throw new Error('Formato incorrecto en pagadurías');
      }


      // 2. Validación del campo laboral
      let laboral = 0;
      if (req.body.trabaja) {
        laboral = (req.body.trabaja === '1' || req.body.trabaja === 'ACTIVO') ? 1 : 0;
      } else if (req.body.laboral) {
        laboral = parseInt(req.body.laboral) === 1 ? 1 : 0;
      }

      // 3. Validación campos numéricos
      const salario = parseInt(req.body.ingresos?.toString().replace(/\D/g, '')) || 0;

      // 4. Construcción segura del objeto cliente
      const clienteData = {
        ...req.body,
        asesor: req.body.asesor || 'Asesor no asignado',
        salario: salario,
        laboral: laboral,
        empresa: laboral === 1 ? (req.body.empresa || 'NO ESPECIFICADO') : 'NO APLICA',
        cargo: laboral === 1 ? (req.body.cargo || 'NO ESPECIFICADO') : 'NO APLICA',
        estado_civil: req.body.estadoCivil || 'N/A',
        cedula_pdf: req.body.archivoPDFUrl || null,
        foto_perfil: req.body.fotoPerfilUrl || null,
        desprendible: req.body.desprendibleUrl || null,
        data_credPdf: req.body.data_credPdf || null,
        bienes: req.body.bienes === 'si' ? 1 : 0,
        bienes_inmuebles: req.body.bienes_inmuebles || null,
        valor_cuota: req.body.valor_cuota ? parseInt(req.body.valor_cuota.toString().replace(/\D/g, '')) : null,
        porcentaje: req.body.porcentaje ? parseFloat(req.body.porcentaje) : null,
        valor_insolvencia: req.body.valor_insolvencia ? parseInt(req.body.valor_insolvencia.toString().replace(/\D/g, '')) : null,
        numero_cuotas: req.body.numero_cuotas ? parseInt(req.body.numero_cuotas) : null,
        referencias_personales,
        referencias_familiares,
        pagadurias: pagadurias,
      };

      const result = await ClienteModel.insertCliente(clienteData);

      res.status(201).json({
        success: true,
        id: result.id_cliente,
        message: 'Cliente creado exitosamente',
        data: {
          nombre: `${req.body.nombre} ${req.body.apellidos}`,
          cedula: req.body.cedula
        }
      });

    } catch (err) {
      console.error('Error detallado al insertar cliente:', {
        message: err.message,
        stack: err.stack,
        bodyReceived: req.body
      });

      if (err.message.includes('Ya existe un cliente con esa cédula')) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al procesar la solicitud',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }
  },


  buscarClientePorCedula: async (req, res) => {
    try {
      const cedula = req.params.cedula;
      const cliente = await ClienteModel.buscarPorCedula(cedula);

      if (cliente) {
        res.json(cliente);
      } else {
        res.status(404).json({ mensaje: 'Cliente no encontrado' });
      }
    } catch (error) {
      console.error('Error al buscar cliente por cédula:', error);
      res.status(500).json({ mensaje: 'Error en el servidor' });
    }
  },

  actualizarCliente: async (req, res) => {

    try {
      const { cedula } = req.params;
      const parseReferences = (field) => {
        try {
          if (!req.body[field]) return [];

          // Si ya es un array, devolverlo directamente
          if (Array.isArray(req.body[field])) {
            return req.body[field];
          }

          // Si es string, parsear como JSON
          if (typeof req.body[field] === 'string') {
            return JSON.parse(req.body[field]);
          }

          return [];
        } catch (e) {
          console.error(`Error parsing ${field}:`, e);
          return [];
        }
      };
      const parsePagadurias = () => {
        try {
          if (!req.body.pagadurias) return [];

          if (Array.isArray(req.body.pagadurias)) {
            return req.body.pagadurias;
          }

          if (typeof req.body.pagadurias === 'string') {
            return JSON.parse(req.body.pagadurias);
          }

          return [];
        } catch (e) {
          console.error('Error parsing pagadurias:', e);
          return [];
        }
      };


      const clienteData = {
        ...req.body,
        referencias_familiares: parseReferences('referencias_familiares'),
        referencias_personales: parseReferences('referencias_personales'),
        pagadurias: parsePagadurias()
      };


      if (req.body.salario) {
        clienteData.salario = req.body.salario
          .replace(/[^\d]/g, ''); // Elimina $, puntos y espacios
      }

      // Manejar archivos
      if (req.files) {
        if (req.files['foto_perfil']?.[0]) {
          clienteData.foto_perfil = '/uploads/fotoPerfil/' + req.files['foto_perfil'][0].filename;
        }
        if (req.files['cedula_pdf']?.[0]) {
          clienteData.cedula_pdf = '/uploads/cedulaPdf/' + req.files['cedula_pdf'][0].filename;
        }
        if (req.files['desprendible_pago']?.[0]) {
          clienteData.desprendible = '/uploads/desprendible/' + req.files['desprendible_pago'][0].filename;
        }
        if (req.files['bienes_inmuebles[]']) {
          clienteData.bienes_rutas = req.files['bienes_inmuebles[]'].map(file => '/uploads/bienesInmuebles/' + file.filename);
        }
      }


      // Convertir campos booleanos
      if (req.body.bienes_inmuebles !== undefined) {
        clienteData.bienes_inmuebles = req.body.bienes_inmuebles === 'si' ? 'si' : 'no';
      }

      const result = await ClienteModel.updateCliente(cedula, clienteData);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error en actualizarCliente:', {
        message: error.message,
        stack: error.stack,
        body: req.body,
        files: req.files
      });
      res.status(500).json({
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  obtenerConteoPorPagaduria: async (req, res) => {
    try {
      // Llamamos al modelo sin agrupar por "otras"
      const data = await ClienteModel.getConteoPorPagaduria();

      // Pagadurías que quieres considerar específicamente
      const pagaduriasPermitidas = [
        'colpensiones',
        'fopep',
        'fiduprevisora',
        'porvenir',
        'seguros alfa',
        'secretaria educacion',
      ];

      const resultado = [];
      let otras = 0;

      data.forEach(row => {
        const nombreNormalizado = row.nombre_pagaduria.toLowerCase().trim();

        if (pagaduriasPermitidas.includes(nombreNormalizado)) {
          resultado.push({
            nombre_pagaduria: nombreNormalizado,
            cantidad: row.cantidad
          });
        } else {
          otras += row.cantidad;
        }
      });

      if (otras > 0) {
        resultado.push({
          nombre_pagaduria: 'otras',
          cantidad: otras
        });
      }

      res.json(resultado);
    } catch (error) {
      console.error('Error al obtener el conteo de pagadurías:', error.message);
      res.status(500).json({ error: 'Error al obtener el conteo de pagadurías' });
    }
  },

  obtenerClientesPorPagaduria: async (req, res) => {
    try {
      const { nombre } = req.params;
      const clientes = await ClienteModel.getClientesPorPagaduria(nombre);
      res.json(clientes);
    } catch (error) {
      console.error('Error al obtener clientes por pagaduría:', error.message);
      res.status(500).json({ error: 'Error al obtener clientes por pagaduría' });
    }
  },



};



module.exports = ClienteController;
