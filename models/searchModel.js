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
            c.estado,
            GROUP_CONCAT(p.nombre_pagaduria SEPARATOR ', ') AS nombres_pagadurias,
            GROUP_CONCAT(p.valor_pagaduria SEPARATOR ', ') AS valores_pagadurias
        FROM clientes c
        LEFT JOIN pagadurias_cliente p 
            ON c.id_cliente = p.id_cliente
        WHERE c.cedula = ?
        GROUP BY c.id_cliente;
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


const getTarjetasByClienteId = (idCliente) => {
    return pool.query(`
        SELECT 
            id_creditos, 
            valor_prestado, 
            interes_prestado, 
            valor_total, 
            fecha_prestamo,  
            asesor, 
            observacion_opcion, 
            obs_credito,
            cred_creado
        FROM creditos
        WHERE id_cliente = ?
    `, [idCliente]);
};

// Buscar bancos
const getBancosByClienteId = (idCliente) => {
    return pool.query(`
        SELECT 
            id_banco, 
            monto_solicitado, 
            monto_aprobado, 
            banco, 
            negociacion, 
            fecha_banco, 
            asesor_banco
        FROM creditos_bancos
        WHERE id_cliente = ?
    `, [idCliente]);
};

// Buscar cuotas de cartera_insolvencia
const getCuotasInsolvenciaByClienteId = (idCliente) => {
    return pool.query(`
        SELECT 
            numero_cuota, 
            valor_cuota, 
            saldo_pendiente, 
            fecha_programada
        FROM cartera_insolvencia
        WHERE id_cliente = ?
          AND fecha_programada <= CURDATE()
          AND (estado = 'PENDIENTE' OR estado = 'PARCIAL')
        ORDER BY numero_cuota ASC
    `, [idCliente]);
};

module.exports = {
    getClienteByCedula,
    getEmbargosByClienteId,
    getInsolvenciaByClienteId,
    getDatacreditoByClienteId,
    getTitulosByClienteId,
    getAudienciasByInsolvenciaId,
    getDesprendibleByInsolvenciaId,
    getTarjetasByClienteId,
    getBancosByClienteId,
    getCuotasInsolvenciaByClienteId
};
