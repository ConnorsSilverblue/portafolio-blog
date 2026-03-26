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
    const result = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
        [email, password]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: "Credenciales invalidas" });
    
    const token = jwt.sign({ id: result.rows[0].id, email }, process.env.JWT_SECRET);
    res.json({ token });
});

app.get('/api/noticias', async (req, res) => {
    const result = await pool.query('SELECT * FROM noticias ORDER BY fecha DESC');
    res.json(result.rows);
});

app.post('/api/noticias', requireJWT, async (req, res) => {
    const { titulo, contenido, categoria } = req.body;
    const result = await pool.query(
        'INSERT INTO noticias (titulo, contenido, categoria, autor_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [titulo, contenido, categoria, req.user.id]
    );
    res.status(201).json(result.rows[0]);
});

app.get('/api/noticias/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM noticias WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]);
});

app.post('/api/comentarios', requireJWT, async (req, res) => {
    const { noticia_id, texto } = req.body;
    const result = await pool.query(
        'INSERT INTO comentarios (noticia_id, usuario_id, texto) VALUES ($1, $2, $3) RETURNING *',
        [noticia_id, req.user.id, texto]
    );
    res.status(201).json(result.rows[0]);
});

app.listen(process.env.PORT, () => {
    console.log(`Servidor en puerto ${process.env.PORT}`);
});