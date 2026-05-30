let alumnaSeleccionada = null;

// --- CONTROL DE LOGIN ---
const formLogin = document.getElementById('formLogin');
if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario = document.getElementById('loginUsuario').value;
        const contrasena = document.getElementById('loginContrasena').value;
        const mensajeError = document.getElementById('mensajeErrorLogin');

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contrasena })
        });
        
        const json = await response.json();
        
        if (json.status === 'success') {
            localStorage.setItem('gymToken', json.token);
            verificarSesion();
        } else {
            mensajeError.textContent = json.message;
            mensajeError.style.display = 'block';
        }
    });
}

function verificarSesion() {
    const token = localStorage.getItem('gymToken');
    if (token === 'pase-autorizado-gym-2026') {
        document.getElementById('pantallaLogin').style.display = 'none';
        document.getElementById('pantallaSistema').style.display = 'block';
        actualizarListaAlumnas(); 
        configurarMesActual(); 
        cargarHistorialGeneral(); 
    } else {
        document.getElementById('pantallaLogin').style.display = 'flex';
        document.getElementById('pantallaSistema').style.display = 'none';
    }
}

function cerrarSesion() {
    localStorage.removeItem('gymToken');
    document.getElementById('formLogin').reset();
    document.getElementById('mensajeErrorLogin').style.display = 'none';
    verificarSesion();
}

// --- CONTROL DEL SISTEMA DE GIMNASIA ---

// Registrar Alumna (Función Directa)
async function registrarAlumnaManual(e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const edad = document.getElementById('edad').value;
    const tutor = document.getElementById('tutor').value;

    const response = await fetch('/api/alumnas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, edad, tutor })
    });
    
    const json = await response.json();
    if(json.status === 'success') {
        document.getElementById('formAlumna').reset();
        actualizarListaAlumnas();
        alert("¡Alumna registrada con éxito!");
    } else {
        alert("Error del servidor: " + json.message);
    }
}

// Cargar Alumnas
async function actualizarListaAlumnas() {
    const response = await fetch('/api/alumnas');
    const json = await response.json();
    const lista = document.getElementById('listaAlumnas');
    if (!lista || json.status !== 'success') return;
    lista.innerHTML = '';
    
    json.data.forEach(alumna => {
        const li = document.createElement('li');
        li.textContent = `${alumna.nombre} (Tutor: ${alumna.tutor})`;
        li.onclick = () => seleccionarAlumna(alumna);
        lista.appendChild(li);
    });
}

// Al dar clic en una alumna
function seleccionarAlumna(alumna) {
    alumnaSeleccionada = alumna;
    document.getElementById('panelControlPagos').style.display = 'block';
    document.getElementById('nombreAlumnaSeleccionada').textContent = alumna.nombre;
    document.getElementById('idAlumnaPago').value = alumna._id;
    actualizarListaPagos(alumna._id);
}

// Eliminar Alumna
async function eliminarAlumnaActual() {
    if (!alumnaSeleccionada) return;

    const confirmar = confirm(`¿Estás COMPLETAMENTE segura de que deseas borrar a "${alumnaSeleccionada.nombre}"?\nEsta acción la eliminará permanentemente.`);

    if (confirmar) {
        const response = await fetch(`/api/alumnas/${alumnaSeleccionada._id}`, {
            method: 'DELETE'
        });
        const json = await response.json();
        if (json.status === 'success') {
            alert('Alumna eliminada.');
            document.getElementById('panelControlPagos').style.display = 'none';
            alumnaSeleccionada = null;
            actualizarListaAlumnas();
            cargarHistorialGeneral();
        }
    }
}

// Registrar Pago
const formPago = document.getElementById('formPago');
if (formPago) {
    formPago.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alumnaId = document.getElementById('idAlumnaPago').value;
        const monto = document.getElementById('montoPago').value;
        const motivo = document.getElementById('motivoPago').value;

        const response = await fetch('/api/pagos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                alumnaId, 
                monto, 
                motivo, 
                alumnaNombre: alumnaSeleccionada.nombre, 
                tutorNombre: alumnaSeleccionada.tutor 
            })
        });
        
        const json = await response.json();
        if(json.status === 'success') {
            actualizarListaPagos(alumnaId);
            mostrarRecibo(json.pago);
            cargarHistorialGeneral(); 
        }
    });
}

// Cargar Historial de Pagos Individual
async function actualizarListaPagos(alumnaId) {
    const response = await fetch(`/api/pagos/${alumnaId}`);
    const json = await response.json();
    const lista = document.getElementById('listaPagos');
    if (!lista || json.status !== 'success') return;
    lista.innerHTML = '';
    
    json.data.forEach(pago => {
        const li = document.createElement('li');
        li.textContent = `${pago.fecha} - ${pago.motivo}: $${pago.monto}`;
        li.onclick = () => mostrarRecibo(pago);
        lista.appendChild(li);
    });
}

// Mostrar Recibo
function mostrarRecibo(pago) {
    document.getElementById('reciboFecha').textContent = pago.fecha;
    document.getElementById('reciboAlumna').textContent = pago.alumnaNombre;
    document.getElementById('reciboTutor').textContent = pago.tutorNombre;
    document.getElementById('reciboConcepto').textContent = pago.motivo;
    document.getElementById('reciboMonto').textContent = pago.monto;

    document.getElementById('modalRecibo').style.display = 'flex';

    setTimeout(() => {
        const captura = document.getElementById('reciboDiseño');
        html2canvas(captura).then(canvas => {
            canvas.toBlob(blob => {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]).then(() => {
                    console.log("¡Recibo copiado!");
                }).catch(err => console.error(err));
            });
        });
    }, 300);

    const textoWhatsapp = encodeURIComponent(`¡Hola! Le comparto el recibo de mensualidad de ${pago.alumnaNombre}.`);
    document.getElementById('btnWhatsapp').onclick = () => {
        window.open(`https://api.whatsapp.com/send?text=${textoWhatsapp}`, '_blank');
    };
}

function cerrarModal() {
    document.getElementById('modalRecibo').style.display = 'none';
}

// --- LÓGICA REPORTES ---
function configurarMesActual() {
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1; 
    const anioActual = fechaActual.getFullYear();

    const selectorMes = document.getElementById('seleccionarMes');
    const selectorAnio = document.getElementById('seleccionarAnio');

    if(selectorMes && selectorAnio && !selectorMes.value) {
        selectorMes.value = mesActual;
        selectorAnio.value = anioActual;
    }
}

async function cargarHistorialGeneral() {
    configurarMesActual();
    const mesBuscado = document.getElementById('seleccionarMes').value;
    const anioBuscado = document.getElementById('seleccionarAnio').value;
    const mesAnioFiltro = `${mesBuscado}/${anioBuscado}`.trim(); 

    const resPagos = await fetch('/api/pagos-general');
    const jsonPagos = await resPagos.json();

    const resAlumnas = await fetch('/api/alumnas');
    const jsonAlumnas = await resAlumnas.json();

    if (jsonPagos.status !== 'success' || jsonAlumnas.status !== 'success') return;

    const mapaAlumnas = {};
    jsonAlumnas.data.forEach(a => { mapaAlumnas[a._id] = a; });

    const listaUI = document.getElementById('listaPagosGeneral');
    if (!listaUI) return;
    listaUI.innerHTML = '';
    
    let ingresosTotales = 0;
    let contadorPagos = 0;

    jsonPagos.data.forEach(pago => {
        const fechaLimpia = pago.fecha.replace(/\s+/g, '');
        const partes = fechaLimpia.split('/');
        
        if (partes.length === 3) {
            const mesAnioPago = `${partes[1]}/${partes[2]}`.trim(); 

            if (mesAnioPago === mesAnioFiltro) {
                ingresosTotales += parseFloat(pago.monto);
                contadorPagos++;

                let nombreAlumna = pago.alumnaNombre || (mapaAlumnas[pago.alumnaId] ? mapaAlumnas[pago.alumnaId].nombre : "Alumna no identificada");
                let nombreTutor = pago.tutorNombre || (mapaAlumnas[pago.alumnaId] ? mapaAlumnas[pago.alumnaId].tutor : "N/A");

                const li = document.createElement('li');
                li.style.padding = "10px";
                li.style.borderBottom = "1px solid #eee";
                li.innerHTML = `<strong>${pago.fecha}</strong> - Alumna: ${nombreAlumna} | Tutor: ${nombreTutor} - <span style="color:#27ae60; font-weight:bold;">$${pago.monto}</span>`;
                listaUI.appendChild(li);
            }
        }
    });

    document.getElementById('totalMensualGeneral').textContent = `$${ingresosTotales}`;
    document.getElementById('cantidadPagosGeneral').textContent = contadorPagos;
}

verificarSesion();