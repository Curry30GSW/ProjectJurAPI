const authModel = require('../models/authModel');
const jwt = require('jsonwebtoken')

const AuthController = {
    async login(req, res) {
        try {
            const { user, password } = req.body;

            if (!user || !password) {
                return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
            }

            const result = await authModel.authenticate(user, password);

            if (result.status === "error") {
                return res.status(401).json({ error: result.message });
            }

            const userAuth = result.user;

            const token = jwt.sign(
                {
                    id: String(userAuth.id),
                    user: userAuth.user,
                    rol: userAuth.rol,
                },
                process.env.JWT_SECRET,
                { expiresIn: "8h" }
            );

            const ipCompleta =
                req.body.ip_usuario ||
                req.headers["x-forwarded-for"] ||
                req.socket.remoteAddress ||
                "";
            const ip_usuario = ipCompleta.startsWith("::ffff:")
                ? ipCompleta.replace("::ffff:", "")
                : ipCompleta;

            await authModel.registrarAuditoria({
                user: userAuth.name,
                rol: userAuth.rol,
                ip_usuario,
                detalle_actividad: "Inicio de sesión en el sistema",
            });

            res.json({
                message: "Login exitoso",
                token,
                name: userAuth.name,
                rol: userAuth.rol,
            });
        } catch (error) {
            console.error("Error en el login:", error);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    },

    async logoutAuditoria(req, res) {
        try {
            const { nombre_usuario, rol } = req.body;

            // Obtener IP limpia (sin body porque no se envía ip_usuario en logout)
            const ipCompleta = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
            const ip_usuario = ipCompleta.startsWith('::ffff:') ? ipCompleta.replace('::ffff:', '') : ipCompleta;

            await authModel.registrarAuditoria({
                nombre_usuario,
                rol,
                ip_usuario,
                detalle_actividad: 'Cierre de sesión en el sistema'
            });

            res.status(200).json({ message: 'Auditoría de cierre registrada' });
        } catch (error) {
            console.error('❌ Error en logoutAuditoria:', error);
            res.status(500).json({ error: 'Error interno al registrar auditoría' });
        }
    }




}

module.exports = AuthController;
