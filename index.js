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

// Configuración adaptable para la base de datos en la nube o local
const rutaAlumnas = process.env.RENDER ? '/opt/render/project/src/alumnas.db' : 'alumnas.db';
const rutaPagos = process.env.RENDER ? '/opt/render/project/src/pagos.db' : 'pagos.db';

const dbAlumnas = new Datastore({ filename: rutaAlumnas, autoload: true });
const dbPagos = new Datastore({ filename: rutaPagos, autoload: true });

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

// --- RUTAS DE PAGOS ---

// 3. Registrar Pago
app.post('/api/pagos', (request, response) => {
    const data = request.body;
    dbPagos.insert(data, (err, newDoc) => {
        if (err) {
            response.json({ status: 'error', message: 'No se pudo registrar el pago' });
            return;
        }
        response.json({ status: 'success', data: newDoc });
    });
});

// 4. Obtener Pagos de una Alumna
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