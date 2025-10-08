module.exports = {
    // ------------------ EMBARGOS ------------------
    "GET /api/clientes-embargos": ["controlTotal", "admin", "embargos", "cartera", "insolvencia"],
    "GET /api/cliente-embargos/:cedula": ["controlTotal", "admin", "embargos", "cartera", "insolvencia"],
    "GET /api/embargos/:id": ["controlTotal", "admin", "embargos", "cartera", "insolvencia"],
    "GET /api/embargos/aceptados": ["controlTotal", "admin", "embargos", "cartera", "insolvencia"],

    "POST /api/crear-embargos": ["controlTotal", "admin", "embargos"],
    "POST /api/subir-desprendible-embargos": ["controlTotal", "admin", "embargos"],
    "PUT /api/embargo/:id_embargos": ["controlTotal", "admin", "embargos"],
    "PUT /api/embargos/:id/notificar": ["controlTotal", "admin", "embargos"],

    // ------------------ TÍTULOS ------------------
    "GET /api/titulos": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/titulos/:id_embargos": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],

    "POST /api/insert-titulos": ["controlTotal", "admin", "embargos"],
    "PUT /api/titulos/:id_embargos": ["controlTotal", "admin", "embargos"],

    // ------------------ CARTERA ------------------
    "GET /api/clientes-cartera": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/clientes-cartera-banco": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/clientes-cartera/:cedula": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/clientes-cartera-bancos/:cedula": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/cliente/:id_cliente": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/cartera/:id_creditos": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/cartera-banco/:id_banco": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/cuotas/pendientes": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/cuotas/pendientes/:id": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/users-comisiones": ["controlTotal", "admin", "cartera"],

    "POST /api/creditos/crear": ["controlTotal", "admin", "cartera"],
    "POST /api/creditos-banco/crear": ["controlTotal", "admin", "cartera"],
    "POST /api/comisiones": ["controlTotal", "admin", "cartera"],
    "POST /api/generar-cuotas/:id_insolvencia": ["controlTotal", "admin", "cartera", "insolvencia"],
    "POST /api/cartera/abonar": ["controlTotal", "admin", "cartera"],
    "POST /api/cuota/actualizar": ["controlTotal", "admin", "cartera"],
    "PUT /api/creditos-banco/marcar-pagado/:id_banco": ["controlTotal", "admin", "cartera"],
    "PUT /api/creditos-tarjeta/marcar-pagado/:id_banco": ["controlTotal", "admin", "cartera"],


    // ------------------ CLIENTES ------------------
    "GET /api/clientes": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "POST /api/insert-clientes": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/clientes/:cedula": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "PUT /api/clientes/:cedula": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/conteo-pagadurias": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/clientes/por-pagaduria/:nombre": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],

    // ------------------ DATACREDITO ------------------
    "GET /api/clientes-datacredito": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/notificaciones": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "POST /api/subir-documento": ["controlTotal", "admin"],
    "POST /api/mover-area": ["controlTotal", "admin"],


    // ------------------ NOTIFICACIONES ------------------
    // GET → todos los roles pueden acceder
    "GET /api/notificaciones-embargo/:id_embargos": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/notificaciones-embargo": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],

    "POST /api/notificaciones-embargos": ["controlTotal", "admin", "embargos"],
    "PUT /api/notificaciones/:id": ["controlTotal", "admin", "embargos"],


    // ------------------ SABANA ------------------
    "POST /api/subir-sabana": ["controlTotal", "admin", "embargos"],
    "GET /api/descargar-sabana": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],
    "GET /api/fechas-usuarios": ["controlTotal", "admin", "cartera", "embargos", "insolvencia"],

    // ------------------ USUARIOS ------------------
    "GET /api/users": ["controlTotal", "admin"],
    "GET /api/users/:id": ["controlTotal", "admin"],
    "POST /api/users-create": ["controlTotal", "admin"],
    "POST /api/users/:id/enable": ["controlTotal", "admin"],
    "POST /api/users/:id/disable": ["controlTotal", "admin"],
    "PUT /api/users-updated/:id": ["controlTotal", "admin"],
};


