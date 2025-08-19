const pool = require('../config/db');

// Buscar cliente por cédula
const getClienteByCedula = (cedula) => {
    return pool.query(`
        SELECT 
            c.id_cliente,
            c.nombres,
            c.apellidos,
            c.cedula,
            c.direccion,
            c.telefono,
            c.edad,
            c.correo,
            c.laboral,
            c.estado_civil,
            c.empresa,
            c.cargo,
            c.foto_perfil,
            c.fecha_vinculo,
            p.nombre_pagaduria,
            p.valor_pagaduria
        FROM clientes c
        LEFT JOIN pagadurias_cliente p 
            ON c.id_cliente = p.id_cliente
        WHERE c.cedula = ?
    `, [cedula]);
};

// Buscar embargos
const getEmbargosByClienteId = (idCliente) => {
    return pool.query(`SELECT * FROM embargos WHERE id_cliente = ?`, [idCliente]);
};

// Buscar insolvencia
const getInsolvenciaByClienteId = (idCliente) => {
    return pool.query(`SELECT * FROM insolvencia WHERE id_cliente = ?`, [idCliente]);
};

const getAudienciasByInsolvenciaId = (idInsolvencia) => {
    return pool.query(`
        SELECT audiencia, Fecha_audiencias
        FROM audiencias
        WHERE id_insolvencia = ?
    `, [idInsolvencia]);
};


const getDesprendibleByInsolvenciaId = (idInsolvencia) => {
    return pool.query(`
        SELECT estado_desprendible, obs_desprendible
        FROM desprendible
        WHERE id_insolvencia = ?
    `, [idInsolvencia]);
};


// Buscar datacrédito
const getDatacreditoByClienteId = (idCliente) => {
    return pool.query(`SELECT 
        fecha_data,
        usuario_data
         FROM datacredito WHERE id_cliente = ?`, [idCliente]);
};

// Buscar títulos (con info de embargos)
const getTitulosByClienteId = (idCliente) => {
    return pool.query(`
        SELECT 
        id_titulo,
        terminacion_ofic,
        terminacion_juzg,
        solicitud_titulos,
        orden_pago
        FROM titulos t
        JOIN embargos e ON t.id_embargos = e.id_embargos
        WHERE e.id_cliente = ?
    `, [idCliente]);
};

module.exports = {
    getClienteByCedula,
    getEmbargosByClienteId,
    getInsolvenciaByClienteId,
    getDatacreditoByClienteId,
    getTitulosByClienteId,
    getAudienciasByInsolvenciaId,
    getDesprendibleByInsolvenciaId
};
