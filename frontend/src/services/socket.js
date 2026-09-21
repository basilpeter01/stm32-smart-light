import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

export function initSocket({ onTelemetryUpdate, onConnect, onDisconnect, onError }) {
  if (socket) {
    socket.disconnect();
  }

  socket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('[Socket.io] Connected to server at', BACKEND_URL);
    if (onConnect) onConnect();
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket.io] Disconnected:', reason);
    if (onDisconnect) onDisconnect(reason);
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket.io] Connection error:', error.message);
    if (onError) onError(error);
  });

  socket.on('telemetry_update', (data) => {
    if (onTelemetryUpdate) {
      onTelemetryUpdate(data);
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
