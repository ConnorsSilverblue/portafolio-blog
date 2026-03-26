const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const contenedor = document.getElementById('contenedorNoticias');
    const detalle = document.getElementById('detalleNoticia');

    if (contenedor) {
        cargarNoticias(contenedor);
    }

    if (detalle) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) cargarDetalle(id, detalle);
    }
});

async function cargarNoticias(contenedor) {
    try {
        const res = await fetch(`${API_URL}/noticias`);
        const noticias = await res.json();
        
        contenedor.innerHTML = noticias.map(n => `
            <div class="col-md-4 mb-4">
                <div class="card h-100" style="background-color: #1e1e1e; border-left: 4px solid #013220;">
                    <div class="card-body text-light">
                        <h5 class="card-title text-decoration-underline" style="cursor:pointer;" onclick="window.location.href='noticia.html?id=${n.id}'">${n.titulo}</h5>
                        <h6 class="card-subtitle mb-2 text-secondary">${n.categoria}</h6>
                        <p class="card-text">${n.contenido.substring(0, 100)}...</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        contenedor.innerHTML = '<p>Conecta la base de datos y enciende el backend para ver las noticias.</p>';
    }
}

async function cargarDetalle(id, contenedor) {
    const res = await fetch(`${API_URL}/noticias/${id}`);
    const noticia = await res.json();
    
    contenedor.innerHTML = `
        <h2 style="color: #ffffff;">${noticia.titulo}</h2>
        <span class="badge mb-3" style="background-color: #800020;">${noticia.categoria}</span>
        <p style="color: #b3b3b3;">${noticia.contenido}</p>
    `;
}
