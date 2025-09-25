const searchModel = require('../models/searchModel');

const buscarPersonaPorCedula = async (req, res) => {
    try {
        const { cedula } = req.params;

        // 1. Buscar cliente
        const [clienteRows] = await searchModel.getClienteByCedula(cedula);
        if (clienteRows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        const cliente = clienteRows[0];

        // 2. Consultar embargos
        const [embargosRows] = await searchModel.getEmbargosByClienteId(cliente.id_cliente);

        // 3. Consultar otros módulos en paralelo
        const [
            insolvenciaRows,
            datacreditoRows,
            tarjetasRows,
            bancosRows,
            cuotasRows
        ] = await Promise.all([
            searchModel.getInsolvenciaByClienteId(cliente.id_cliente).then(([rows]) => rows),
            searchModel.getDatacreditoByClienteId(cliente.id_cliente).then(([rows]) => rows),
            searchModel.getTarjetasByClienteId(cliente.id_cliente).then(([rows]) => rows),
            searchModel.getBancosByClienteId(cliente.id_cliente).then(([rows]) => rows),
            searchModel.getCuotasInsolvenciaByClienteId(cliente.id_cliente).then(([rows]) => rows)
        ]);

        // 4. Audiencias y desprendible solo si hay insolvencia
        let audienciasRows = [];
        let desprendibleRows = [];
        if (insolvenciaRows.length > 0) {
            const idInsolvencia = insolvenciaRows[0].id_insolvencia;
            const [audiencias, desprendible] = await Promise.all([
                searchModel.getAudienciasByInsolvenciaId(idInsolvencia).then(([rows]) => rows),
                searchModel.getDesprendibleByInsolvenciaId(idInsolvencia).then(([rows]) => rows)
            ]);
            audienciasRows = audiencias;
            desprendibleRows = desprendible;
        }

        // 5. Títulos si corresponde
        let titulosRows = [];
        if (embargosRows.some(e => e.titulos === 1)) {
            const [rows] = await searchModel.getTitulosByClienteId(cliente.id_cliente);
            titulosRows = rows;
        }

        // 6. Construir respuesta
        const resultado = {
            cliente,
            modulos: {
                embargos: embargosRows,
                insolvencia: insolvenciaRows,
                audiencias: audienciasRows,
                desprendible: desprendibleRows,
                datacredito: datacreditoRows,
                titulos: titulosRows,
                cartera: {
                    tarjetas: tarjetasRows,
                    bancos: bancosRows,
                    cuotas: cuotasRows
                }
            },
            encontradoEn: []
        };

        if (embargosRows.length > 0) resultado.encontradoEn.push('Embargos');
        if (insolvenciaRows.length > 0) resultado.encontradoEn.push('Insolvencia');
        if (audienciasRows.length > 0) resultado.encontradoEn.push('Audiencias');
        if (desprendibleRows.length > 0) resultado.encontradoEn.push('Desprendible');
        if (datacreditoRows.length > 0) resultado.encontradoEn.push('Datacrédito');
        if (titulosRows.length > 0) resultado.encontradoEn.push('Títulos');
        if (tarjetasRows.length > 0 || bancosRows.length > 0) resultado.encontradoEn.push('Cartera');

        res.json(resultado);

    } catch (error) {
        console.error('Error buscando persona:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


module.exports = { buscarPersonaPorCedula };
