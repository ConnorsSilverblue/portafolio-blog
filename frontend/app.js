const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    
    if (document.getElementById('navCategorias')) {
        cargarCategorias();
        cargarNoticias();
    }

    if (document.getElementById('detalleNoticia')) {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) cargarDetalle(id);
    }
});

function verificarLogin() {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    const navLogin = document.getElementById('estadoLogin');
    if (navLogin) {
        if (token) {
            navLogin.innerText = email + ' (Salir)';
            navLogin.onclick = () => {
                localStorage.clear();
                window.location.reload();
            };
        } else {
            navLogin.innerText = 'Login/Registro';
            navLogin.onclick = toggleLogin;
        }
    }
}

function toggleLogin() {
    document.getElementById('loginForm').classList.toggle('d-none');
}

async function login() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passInput').value;
    const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('email', data.email);
        window.location.reload();
    } else {
        alert(data.error);
    }
}

async function registro() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passInput').value;
    const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (res.ok) {
        alert("Registro exitoso, ahora puedes ingresar");
    } else {
        alert("Error al registrar");
    }
}

async function cargarCategorias() {
    const res = await fetch(`${API_URL}/categorias`);
    const categorias = await res.json();
    const nav = document.getElementById('navCategorias');
    nav.innerHTML = categorias.map(c => `
        <a class="nav-link" href="#" onclick="filtrarCategoria(${c.id})">${c.nombre}</a>
    `).join('');
}

function filtrarCategoria(id) {
    sessionStorage.setItem('filtroCategoria', id);
    cargarNoticias();
}

async function cargarNoticias() {
    const orden = document.getElementById('ordenSelect').value;
    const categoria = sessionStorage.getItem('filtroCategoria');
    let url = `${API_URL}/noticias?orden=${orden}`;
    if (categoria) url += `&categoria=${categoria}`;

    const res = await fetch(url);
    const noticias = await res.json();
    const contenedor = document.getElementById('contenedorNoticias');
    
    contenedor.innerHTML = noticias.map(n => `
        <div class="col-md-4">
            <div class="news-card h-100 d-flex flex-column" onclick="window.location.href='noticia.html?id=${n.id}'" style="cursor:pointer">
                ${n.imagen_url ? `<img src="${n.imagen_url}" class="card-img-top" style="height: 200px; object-fit: cover;">` : ''}
                <div class="card-body p-4">
                    <span class="badge-category mb-3 d-inline-block">${n.categoria}</span>
                    <h5 class="card-title mb-3 text-light">${n.titulo}</h5>
                    <p class="card-text text-secondary mb-0">${n.contenido.substring(0, 100)}...</p>
                </div>
            </div>
        </div>
    `).join('');
}

async function cargarDetalle(id) {
    const res = await fetch(`${API_URL}/noticias/${id}`);
    const noticia = await res.json();
    const contenedor = document.getElementById('detalleNoticia');
    
    contenedor.innerHTML = `
        <div class="news-card p-5">
            <span class="badge-category mb-3 d-inline-block">${noticia.categoria}</span>
            <h2 class="hero-title mb-4">${noticia.titulo}</h2>
            ${noticia.imagen_url ? `<img src="${noticia.imagen_url}" class="img-fluid mb-4 rounded" style="max-height: 400px;">` : ''}
            <p style="color: #94a3b8; font-size: 1.1rem; line-height: 1.8;">${noticia.contenido}</p>
            <p class="text-secondary mt-4">Autor: ${noticia.autor}</p>
            
            <div class="d-flex gap-3 my-4 align-items-center">
                <button class="btn btn-primary" onclick="reaccionar(${id}, true)">👍 Like (${noticia.likes.length})</button>
                <button class="btn btn-danger" onclick="reaccionar(${id}, false)">👎 Dislike (${noticia.dislikes})</button>
                <button class="btn btn-outline-light btn-sm" onclick="alert('Likes de:\\n${noticia.likes.join('\\n')}')">Ver likes</button>
            </div>

            <div class="mt-5 border-top border-secondary pt-4">
                <h4 class="text-light">Comentarios</h4>
                <div class="d-flex mb-4">
                    <input type="text" id="comentarioInput" class="form-control bg-dark text-light border-secondary" placeholder="Escribe un comentario...">
                    <button class="btn btn-success ms-2" onclick="comentar(${id})">Enviar</button>
                </div>
                <div id="listaComentarios">
                    ${noticia.comentarios.map(c => `
                        <div class="bg-dark p-3 rounded mb-2 border border-secondary">
                            <strong class="text-light">${c.email}</strong>
                            <p class="text-secondary mb-0">${c.texto}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

async function reaccionar(id, es_like) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Debes iniciar sesión');
    
    await fetch(`${API_URL}/noticias/${id}/reaccion`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ es_like })
    });
    cargarDetalle(id);
}

async function comentar(id) {
    const token = localStorage.getItem('token');
    if (!token) return alert('Debes iniciar sesión');
    
    const texto = document.getElementById('comentarioInput').value;
    if (!texto) return;

    await fetch(`${API_URL}/noticias/${id}/comentarios`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ texto })
    });
    cargarDetalle(id);
}