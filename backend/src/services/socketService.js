import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Allow clients to join an execution-specific room or an org-level room
    socket.on('join_execution', (executionId) => {
      socket.join(`execution_${executionId}`);
      console.log(`[Socket] Client ${socket.id} joined room: execution_${executionId}`);
    });

    socket.on('leave_execution', (executionId) => {
      socket.leave(`execution_${executionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

/**
 * Helper to emit execution status updates
 */
export const emitExecutionUpdate = (executionId, eventName, payload) => {
  if (io) {
    io.to(`execution_${executionId}`).emit(eventName, payload);
  }
};
