CREATE DATABASE blog_noticias;

\c blog_noticias;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255)
);

CREATE TABLE noticias (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255),
    contenido TEXT,
    categoria VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    autor_id INTEGER REFERENCES usuarios(id)
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    noticia_id INTEGER REFERENCES noticias(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    texto TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);