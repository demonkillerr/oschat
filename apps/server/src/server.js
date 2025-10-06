import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.WEB_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  // eslint-disable-next-line no-console
  console.log(`[socket] connected id=${socket.id} from ${socket.handshake.headers.origin || 'unknown-origin'}`);
  socket.emit('hello', { message: 'Socket.io server ready' });
  socket.on('disconnect', (reason) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] disconnected id=${socket.id} reason=${reason}`);
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server listening on :${port}`);
});

