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
            <div class="col-md-4">
                <div class="news-card h-100 d-flex flex-column">
                    <div class="card-body p-4">
                        <span class="badge-category mb-3 d-inline-block">${n.categoria}</span>
                        <h5 class="card-title mb-3" onclick="window.location.href='noticia.html?id=${n.id}'">${n.titulo}</h5>
                        <p class="card-text text-secondary mb-0">${n.contenido.substring(0, 100)}...</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        contenedor.innerHTML = '<p class="text-center text-danger">Conecta la base de datos y enciende el backend.</p>';
    }
}

async function cargarDetalle(id, contenedor) {
    const res = await fetch(`${API_URL}/noticias/${id}`);
    const noticia = await res.json();
    
    contenedor.innerHTML = `
        <div class="news-card p-5 mt-5">
            <span class="badge-category mb-3 d-inline-block">${noticia.categoria}</span>
            <h2 class="hero-title mb-4">${noticia.titulo}</h2>
            <p style="color: #94a3b8; font-size: 1.1rem; line-height: 1.8;">${noticia.contenido}</p>
        </div>
    `;
}