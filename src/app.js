const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

const VERSION = process.env.APP_VERSION || '1.0.0';

function validarLibro(body) {
  const { titulo, autor, anio_publicacion } = body || {};
  if (typeof titulo !== 'string' || titulo.trim() === '') return 'titulo es obligatorio';
  if (typeof autor !== 'string' || autor.trim() === '') return 'autor es obligatorio';
  if (!Number.isInteger(anio_publicacion)) return 'anio_publicacion debe ser un entero';
  return null;
}

function idValido(id) {
  return /^\d+$/.test(id);
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', version: VERSION });
});

app.get('/libros', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM libros ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/libros/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'id inválido' });
  try {
    const [rows] = await pool.query('SELECT * FROM libros WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.post('/libros', async (req, res) => {
  const error = validarLibro(req.body);
  if (error) return res.status(400).json({ error });
  const { titulo, autor, anio_publicacion } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO libros (titulo, autor, anio_publicacion) VALUES (?, ?, ?)',
      [titulo.trim(), autor.trim(), anio_publicacion]
    );
    res.status(201).json({
      id: result.insertId,
      titulo: titulo.trim(),
      autor: autor.trim(),
      anio_publicacion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.put('/libros/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'id inválido' });
  const error = validarLibro(req.body);
  if (error) return res.status(400).json({ error });
  const { titulo, autor, anio_publicacion } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE libros SET titulo = ?, autor = ?, anio_publicacion = ? WHERE id = ?',
      [titulo.trim(), autor.trim(), anio_publicacion, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json({
      id: Number(req.params.id),
      titulo: titulo.trim(),
      autor: autor.trim(),
      anio_publicacion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.delete('/libros/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ error: 'id inválido' });
  try {
    const [result] = await pool.query('DELETE FROM libros WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Libro no encontrado' });
    res.json({ mensaje: 'Libro eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = app;