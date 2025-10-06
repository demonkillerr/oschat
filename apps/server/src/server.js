import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';

const port = process.env.PORT || 4000;
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  socket.emit('hello', { message: 'Socket.io server ready' });
  socket.on('disconnect', () => {});
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`server listening on :${port}`);
});

