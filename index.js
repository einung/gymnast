const express = require('express');
const Datastore = require('nedb');
const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});

app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

// --- CONFIGURACIÓN DE ACCESO ---
const USUARIO_ADMIN = "admin";
const CONTRASENA_ADMIN = "gimnasia2026";

// --- CONFIGURACIÓN DE LA BASE DE DATOS ---
const dbAlumnas = new Datastore({ filename: 'alumnas.db', autoload: true });
const dbPagos = new Datastore({ filename: 'pagos.db', autoload: true });

// 🚀 AUTALLENADO DE ALUMNAS (PLAN B)
// Si la base de datos está vacía, metemos 3 alumnas de prueba automáticamente para que puedas trabajar
dbAlumnas.count({}, (err, count) => {
    if (!err && count === 0) {
        const alumnasIniciales = [
            { nombre: "Anna Sofia Flores Coronado", edad: "5", tutor: "Maria Isabel Gonzalez Lopez" },
            { nombre: "Valeria Mia Agali", edad: "7", tutor: "Carlos Agali" },
            { nombre: "Camila Einung", edad: "6", tutor: "Sara Einung" }
        ];
        dbAlumnas.insert(alumnasIniciales, (insertErr) => {
            if (!insertErr) console.log("✨ Alumnas de prueba cargadas con éxito.");
        });
    }
});

// RUTA DE LOGIN
app.post('/api/login', (request, response) => {
    const { usuario, contrasena } = request.body;
    if (usuario === USUARIO_ADMIN && contrasena === CONTRASENA_ADMIN) {
        response.json({ status: 'success', token: 'pase-autorizado-gym-2026' });
    } else {
        response.json({ status: 'error', message: 'Usuario o contraseña incorrectos' });
    }
});

// --- RUTAS DE ALUMNAS ---

// 1. Guardar Alumna
app.post('/api/alumnas', (request, response) => {
    const data = request.body;
    dbAlumnas.insert(data, (err, newDoc) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudo guardar la alumna' });
            return;
        }
        response.json({ status: 'success', data: newDoc });
    });
});

// 2. Obtener Alumnas
app.get('/api/alumnas', (request, response) => {
    dbAlumnas.find({}, (err, data) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudieron cargar las alumnas' });
            return;
        }
        response.json({ status: 'success', data: data });
    });
});

// 3. Eliminar Alumna
app.delete('/api/alumnas/:id', (request, response) => {
    const idAlumna = request.params.id;
    dbAlumnas.remove({ _id: idAlumna }, {}, (err, numRemoved) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudo eliminar la alumna' });
            return;
        }
        dbPagos.remove({ alumnaId: idAlumna }, { multi: true }, (errPagos, numPagosRemoved) => {
            response.json({ status: 'success' });
        });
    });
});

// --- RUTAS DE PAGOS ---

// 4. Registrar Pago
app.post('/api/pagos', (request, response) => {
    const data = request.body;
    if (!data.fecha) {
        const hoy = new Date();
        data.fecha = `${hoy.getDate()}/${hoy.getMonth() + 1}/${hoy.getFullYear()}`;
    }
    dbPagos.insert(data, (err, newDoc) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudo registrar el pago' });
            return;
        }
        response.json({ status: 'success', pago: newDoc });
    });
});

// 5. Obtener Pagos del Historial General
app.get('/api/pagos-general', (request, response) => {
    dbPagos.find({}, (err, data) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudieron cargar los pagos generales' });
            return;
        }
        response.json({ status: 'success', data: data });
    });
});

// 6. Obtener Pagos de una Alumna Específica
app.get('/api/pagos/:alumnaId', (request, response) => {
    const alumnaId = request.params.alumnaId;
    dbPagos.find({ alumnaId: alumnaId }, (err, data) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudieron cargar los pagos' });
            return;
        }
        response.json({ status: 'success', data: data });
    });
});