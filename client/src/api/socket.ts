import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket: Socket | null = null;

export const initClientSocket = (userId?: string, role?: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to PawConnect Real-time Socket server");
      if (userId || role) {
        socket?.emit("join", { userId, role });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Disconnected from socket server");
    });
  } else if (userId || role) {
    socket.emit("join", { userId, role });
  }

  return socket;
};

export const getClientSocket = (): Socket | null => socket;

export const disconnectClientSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
