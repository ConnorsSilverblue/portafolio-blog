require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const requireJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Token ausente" });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ error: "Token invalido" });
    }
};

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (email, password) VALUES ($1, $2) RETURNING id, email',
            [email, password]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: "Error al registrar" });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
            [email, password]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: "Credenciales invalidas" });
        const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET);
        res.json({ token, email });
    } catch (error) {
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.get('/api/categorias', async (req, res) => {
    const result = await pool.query('SELECT * FROM categorias');
    res.json(result.rows);
});

app.get('/api/noticias', async (req, res) => {
    const orden = req.query.orden === 'asc' ? 'ASC' : 'DESC';
    const categoriaId = req.query.categoria;
    
    let query = `
        SELECT n.id, n.titulo, n.contenido, n.imagen_url, n.fecha, c.nombre as categoria
        FROM noticias n
        JOIN categorias c ON n.categoria_id = c.id
    `;
    const params = [];

    if (categoriaId) {
        query += ` WHERE n.categoria_id = $1`;
        params.push(categoriaId);
    }

    query += ` ORDER BY n.fecha ${orden}`;

    try {
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener noticias" });
    }
});

app.get('/api/noticias/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT n.*, c.nombre as categoria, u.email as autor
            FROM noticias n
            JOIN categorias c ON n.categoria_id = c.id
            JOIN usuarios u ON n.autor_id = u.id
            WHERE n.id = $1
        `, [id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: "Noticia no encontrada" });

        const likesResult = await pool.query(`
            SELECT u.email FROM likes l
            JOIN usuarios u ON l.usuario_id = u.id
            WHERE l.noticia_id = $1 AND l.es_like = true
        `, [id]);

        const dislikesResult = await pool.query(`
            SELECT COUNT(*) as total FROM likes
            WHERE noticia_id = $1 AND es_like = false
        `, [id]);

        const comentariosResult = await pool.query(`
            SELECT c.texto, u.email FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            WHERE c.noticia_id = $1
            ORDER BY c.fecha DESC
        `, [id]);

        res.json({
            ...result.rows[0],
            likes: likesResult.rows.map(r => r.email),
            dislikes: dislikesResult.rows[0].total,
            comentarios: comentariosResult.rows
        });
    } catch (error) {
        res.status(500).json({ error: "Error al cargar detalle" });
    }
});

app.post('/api/noticias', requireJWT, async (req, res) => {
    const { titulo, contenido, imagen_url, categoria_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO noticias (titulo, contenido, imagen_url, autor_id, categoria_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [titulo, contenido, imagen_url, req.user.id, categoria_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: "Error al crear noticia" });
    }
});

app.post('/api/noticias/:id/reaccion', requireJWT, async (req, res) => {
    const { id } = req.params;
    const { es_like } = req.body;
    try {
        await pool.query(
            `INSERT INTO likes (noticia_id, usuario_id, es_like) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (noticia_id, usuario_id) 
             DO UPDATE SET es_like = $3`,
            [id, req.user.id, es_like]
        );
        res.json({ message: "Reacción registrada" });
    } catch (error) {
        res.status(400).json({ error: "Error al reaccionar" });
    }
});

app.post('/api/noticias/:id/comentarios', requireJWT, async (req, res) => {
    const { id } = req.params;
    const { texto } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO comentarios (noticia_id, usuario_id, texto) VALUES ($1, $2, $3) RETURNING *',
            [id, req.user.id, texto]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(400).json({ error: "Error al comentar" });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor en puerto ${process.env.PORT}`);
});