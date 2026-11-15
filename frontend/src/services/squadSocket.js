import { io } from 'socket.io-client';
import api from './api';

let socket = null;

export function getSquadSocket() {
  const token = localStorage.getItem('auth-token');
  const base = api.defaults?.baseURL || '';
  const origin = base.replace(/\/api\/?$/i, '') || window.location.origin;
  if (socket?.connected) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSquadSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
