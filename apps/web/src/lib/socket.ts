import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string | null): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
    socket = io(url, {
      auth: {
        token: token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null),
      },
      autoConnect: false,
    });
  }
  
  if (!socket.connected) {
    socket.connect();
  }
  
  return socket;
}

export function updateSocketAuth(token: string) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket(token);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

