const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Permitir que el servidor entienda datos en formato JSON
app.use(express.json());

// Servir de forma automática los archivos que están dentro de la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Encender el servidor en el puerto 3000
app.listen(PORT, () => {
    console.log(`🤸‍♀️ Servidor de gimnasia corriendo en http://localhost:${PORT}`);
});