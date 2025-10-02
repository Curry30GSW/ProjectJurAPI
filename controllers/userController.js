const UserModel = require('../models/userModel');

const UserController = {
    create: async (req, res) => {
        try {
            const result = await UserModel.create(req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error creando usuario" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await UserModel.update(id, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error actualizando usuario" });
        }
    },

    // Habilitar
    enable: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await UserModel.enable(id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error habilitando usuario" });
        }
    },


    disable: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await UserModel.disable(id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error inhabilitando usuario" });
        }
    },

    getAll: async (req, res) => {
        try {
            const users = await UserModel.getAll();
            res.json(users);
        } catch (error) {
            res.status(500).json({ status: "error", message: "Error obteniendo usuarios" });
        }
    },

    getAllUsers: async (req, res) => {
        try {

            const users = await UserModel.getAllUser();

            res.status(200).json({
                success: true,
                data: users
            }
            );
        } catch (error) {
            console.error('Error en getCreditoById:', error);
            res.status(500).json({ message: 'Error al obtener crédito' });
        }

    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const usuario = await UserModel.getById(id);

            if (!usuario) {
                return res.status(404).json({ status: "error", message: "Usuario no encontrado" });
            }

            res.json(usuario);
        } catch (error) {
            console.error("❌ Error obteniendo usuario:", error);
            res.status(500).json({ status: "error", message: "Error obteniendo usuario" });
        }
    },

};

module.exports = UserController;
