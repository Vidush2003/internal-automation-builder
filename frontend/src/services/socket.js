import { io } from 'socket.io-client';

// We want to connect to the host root so the vite proxy catches /socket.io
// instead of trying to connect to /api/socket.io
const SOCKET_URL = '/';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};