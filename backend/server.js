const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./src/lib/prisma');

dotenv.config();

const app = express();

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,http://127.0.0.1:5173,https://campusnet.vercel.app,https://c2net.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Middleware
if (process.env.TRUST_PROXY === "true" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));
app.use(cors(corsOptions));
app.use(apiLimiter);

// Import Routes
const commentRoutes = require("./src/routes/commentRoutes");
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const threadRoutes = require('./src/routes/threadRoutes');
const squadRoutes = require("./src/routes/squadRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const aiRoutes = require("./src/routes/aiRoutes");
const { notFound, errorHandler } = require("./src/middleware/errorMiddleware");

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/squads', squadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);
app.use("/api/thread", threadRoutes);
app.use("/api/comments", commentRoutes);

// Health Check Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Test Route
app.get('/', (req, res) => {
  res.send('Campus Connect API is Running... ');
});

app.use(notFound);
app.use(errorHandler);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : true,
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      (typeof socket.handshake.headers?.authorization === 'string' &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : null);
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (e) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.on('join_squad', async ({ squadId }, ack) => {
    try {
      const sid = String(squadId || '').trim();
      if (!sid) {
        if (typeof ack === 'function') ack({ ok: false, error: 'squadId required' });
        return;
      }
      let squad = await prisma.squad.findUnique({ where: { id: sid } }).catch(() => null);
      if (!squad) {
        squad = await prisma.squad.findFirst({ where: { name: { equals: sid, mode: 'insensitive' } } }).catch(() => null);
      }
      if (!squad) {
        try {
          squad = await prisma.squad.create({
            data: {
              name: sid === 'general' ? 'General' : sid.replace(/[-_]/g, ' '),
              ownerId: socket.userId,
            },
          });
        } catch {
          squad = await prisma.squad.findFirst({ where: { name: sid } }).catch(() => null);
        }
      }
      if (squad) {
        const member = await prisma.squadMember.findFirst({
          where: { squadId: squad.id, userId: socket.userId },
        }).catch(() => null);
        if (!member) {
          await prisma.squadMember.create({
            data: { squadId: squad.id, userId: socket.userId, role: 'member' },
          }).catch(() => {});
        }
      }
      socket.join(`squad:${sid}`);
      if (squad && squad.id !== sid) {
        socket.join(`squad:${squad.id}`);
      }
      if (typeof ack === 'function') ack({ ok: true, squadId: squad?.id || sid });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message || 'join failed' });
    }
  });

  socket.on('send_squad_message', async (payload, ack) => {
    try {
      const rawSquadId = String(payload?.squadId || '').trim();
      const content = String(payload?.content || '').trim();
      if (!rawSquadId || !content) {
        if (typeof ack === 'function') ack({ ok: false, error: 'squadId and content required' });
        return;
      }
      if (content.length > 4000) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Message too long' });
        return;
      }

      let squad = await prisma.squad.findUnique({ where: { id: rawSquadId } }).catch(() => null);
      if (!squad) {
        squad = await prisma.squad.findFirst({ where: { name: { equals: rawSquadId, mode: 'insensitive' } } }).catch(() => null);
      }
      if (!squad) {
        squad = await prisma.squad.create({
          data: {
            name: rawSquadId === 'general' ? 'General' : rawSquadId.replace(/[-_]/g, ' '),
            ownerId: socket.userId,
          },
        }).catch(() => null);
      }

      const targetSquadId = squad ? squad.id : rawSquadId;

      const member = await prisma.squadMember.findFirst({
        where: { squadId: targetSquadId, userId: socket.userId },
      }).catch(() => null);
      if (!member && squad) {
        await prisma.squadMember.create({
          data: { squadId: targetSquadId, userId: socket.userId, role: 'member' },
        }).catch(() => {});
      }

      const msg = await prisma.squadMessage.create({
        data: { squadId: targetSquadId, senderId: socket.userId, content },
        include: {
          sender: {
            select: { id: true, username: true, fullName: true, profileImageUrl: true },
          },
        },
      });
      const out = {
        id: msg.id,
        squadId: rawSquadId,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        sender: {
          id: msg.sender.id,
          username: msg.sender.username,
          name: msg.sender.fullName || msg.sender.username,
          avatar: msg.sender.profileImageUrl || '',
        },
      };
      io.to(`squad:${rawSquadId}`).emit('receive_squad_message', out);
      if (targetSquadId !== rawSquadId) {
        io.to(`squad:${targetSquadId}`).emit('receive_squad_message', out);
      }
      if (typeof ack === 'function') ack({ ok: true, message: out });
    } catch (err) {
      if (typeof ack === 'function') ack({ ok: false, error: err.message || 'send failed' });
    }
  });
});

app.set('io', io);

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, httpServer, io };