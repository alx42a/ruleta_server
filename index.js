// index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// === CORS dinámico desde .env o permitir todos por defecto ===
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['*'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === Multer para recibir imagen como buffer en memoria ===
const storage = multer.memoryStorage();
const upload = multer({ storage });

// === Estructura por sala para comprobantes y jugadores ===
const salas = {};

// === SOCKET.IO ===
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  socket.on('unirse_sala', (sala) => {
    socket.join(sala);
    socket.sala = sala;
    if (!salas[sala]) salas[sala] = { jugadores: [], comprobante: null };
    console.log(`✅ ${socket.id} se unió a ${sala}`);
  });

  socket.on('turno_jugador', ({ sala, jugador }) => {
    io.to(sala).emit('turno_actual', jugador);
  });

  socket.on('mensaje_chat', (data) => {
    io.to(data.sala).emit('mensaje_chat', data);
  });

  socket.on('mensaje_admin', ({ sala, mensaje }) => {
    io.to(sala).emit('mensaje_chat', { autor: 'ADMIN', mensaje });
  });

  socket.on('seleccionar_numero', ({ sala, jugador, numero }) => {
    io.to(sala).emit('numero_elegido', { jugador, numero });
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuario desconectado:', socket.id);
  });
});

// === Ruta POST para subir comprobante ===
app.post('/subir', upload.single('comprobante'), (req, res) => {
  const { nombre, yape, mensaje, sala } = req.body;

  if (!req.file) {
    return res.status(400).json({ mensaje: '⚠️ No se recibió archivo' });
  }

  const base64Image = req.file.buffer.toString('base64');
  salas[sala] = salas[sala] || {};
  salas[sala].comprobante = base64Image;

  io.to(sala).emit('nuevo_comprobante', {
    nombre,
    yape,
    mensaje,
    imagen: base64Image
  });

  res.json({ mensaje: '✅ Comprobante recibido correctamente' });
});

// === Puerto dinámico para Railway o local ===
const PORT = process.env.PORT; 
server.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
