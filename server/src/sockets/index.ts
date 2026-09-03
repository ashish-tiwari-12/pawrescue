import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`⚡ [Socket.io] Client connected: ${socket.id}`);

    // Join room for specific role or user
    socket.on("join", (data: { userId?: string; role?: string }) => {
      if (data?.role) {
        socket.join(`role:${data.role}`);
      }
      if (data?.userId) {
        socket.join(`user:${data.userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔌 [Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const broadcastEvent = (event: string, payload: any) => {
  if (io) {
    io.emit(event, payload);
  }
};
