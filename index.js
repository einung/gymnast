const express = require('express');
const Datastore = require('nedb');
const app = express();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

app.use(express.static('public'));
app.use(express.json({ limit: '1mb' }));

// --- CONFIGURACIÓN DE ACCESO ---
const USUARIO_ADMIN = "admin";
const CONTRASENA_ADMIN = "gimnasia2026";

// Bases de datos locales
const dbAlumnas = new Datastore('alumnas.db');
const dbPagos = new Datastore('pagos.db');
dbAlumnas.loadDatabase();
dbPagos.loadDatabase();

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
    data.timestamp = Date.now();
    dbAlumnas.insert(data, (err, newDoc) => {
        if (err) return response.status(500).json({ status: 'error' });
        response.json({ status: 'success', alumna: newDoc });
    });
});

// 2. Obtener todas las Alumnas
app.get('/api/alumnas', (request, response) => {
    dbAlumnas.find({}, (err, data) => {
        if (err) return response.end();
        response.json(data);
    });
});

// 3. BORRAR ALUMNA Y SUS PAGOS (REVISADA Y ASEGURADA)
app.delete('/api/alumnas/:id', (request, response) => {
    const idAlumna = request.params.id;

    dbAlumnas.remove({ _id: idAlumna }, {}, (err, numRemoved) => {
        if (err) {
            return response.status(500).json({ status: 'error', message: 'Error al borrar de la base de datos' });
        }

        // Borrar en cascada todos los pagos de esa alumna
        dbPagos.remove({ alumnaId: idAlumna }, { multi: true }, (errPagos, numPagosRemoved) => {
            if (errPagos) {
                return response.status(500).json({ status: 'error', message: 'Se borró la alumna pero no sus pagos' });
            }
            response.json({ status: 'success', message: 'Alumna eliminada correctamente' });
        });
    });
});


// --- RUTAS DE PAGOS ---

// 1. Registrar un pago
app.post('/api/pagos', (request, response) => {
    const data = request.body;
    data.fecha = new Date().toLocaleDateString('es-MX');
    data.timestamp = Date.now();
    
    dbPagos.insert(data, (err, newDoc) => {
        if (err) return response.status(500).json({ status: 'error' });
        response.json({ status: 'success', pago: newDoc });
    });
});

// 2. Obtener historial individual
app.get('/api/pagos/:alumnaId', (request, response) => {
    const alumnaId = request.params.alumnaId;
    dbPagos.find({ alumnaId: alumnaId }).sort({ timestamp: -1 }).exec((err, data) => {
        if (err) return response.end();
        response.json(data);
    });
});

// 3. Obtener todos los pagos del sistema
app.get('/api/pagos-general', (request, response) => {
    dbPagos.find({}).sort({ timestamp: -1 }).exec((err, data) => {
        if (err) return response.end();
        response.json(data);
    });
});