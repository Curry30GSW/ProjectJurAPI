const path = require('path');
const Sabana = require('../models/sabanaModel');

const subirSabana = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No se subió ningún archivo' });
        }

        const rutaArchivo = path.join('uploads', 'sabanas', req.file.filename);
        const usuario = req.body.usuario || 'desconocido';
        const fecha = req.body.fecha;

        await Sabana.guardar(rutaArchivo, usuario, fecha);

        return res.status(200).json({
            success: true,
            message: 'Sabana subida y registrada correctamente',
            ruta: rutaArchivo,
        });
    } catch (error) {
        console.error("❌ Error en subirSabana:", error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

const descargarSabana = (req, res) => {
    const filePath = path.join(__dirname, '../uploads/sabanas/sabana.xlsx');
    res.download(filePath, 'sabana.xlsx', (err) => {
        if (err) {
            console.error('Error al descargar el archivo:', err);
            if (!res.headersSent) {
                res.status(500).send('Error al descargar el archivo');
            }
        }
    });
};

const obtenerFechasUsuarios = async (req, res) => {
    try {
        const resultados = await Sabana.listarFechasUsuarios();

        if (!resultados || resultados.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron registros de sábanas'
            });
        }

        // Enviamos los datos exactamente como vienen de la base de datos
        res.status(200).json({
            success: true,
            data: resultados.map(item => ({
                usuario: item.usuario_sabana,
                fecha: item.fecha_sabana // Enviamos la fecha sin formatear
            }))
        });

    } catch (error) {
        console.error("❌ Error en obtenerFechasUsuarios:", error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial de sábanas',
            error: error.message
        });
    }
};



module.exports = { subirSabana, descargarSabana, obtenerFechasUsuarios };
