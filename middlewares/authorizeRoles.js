const authorizeRoles = (permisos) => {
    return (req, res, next) => {
        const rolUsuario = req.user?.rol;

        if (!rolUsuario) {
            return res.status(401).json({
                status: "error",
                message: "Usuario no autenticado"
            });
        }

        // Construir la clave: método HTTP + ruta
        const claveRuta = `${req.method} ${req.baseUrl}${req.route.path}`;
        const reglasRuta = permisos[claveRuta];

        if (reglasRuta && !reglasRuta.includes(rolUsuario)) {
            return res.status(403).json({
                status: "error",
                message: "No tienes permisos para esta acción"
            });
        }

        next();
    };
};

module.exports = authorizeRoles;
