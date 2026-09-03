import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketInstance.on("connect", () => {
      console.log("🟢 NGO Platform connected to real-time dispatch socket:", socketInstance?.id);
    });

    socketInstance.on("disconnect", () => {
      console.log("🔴 NGO Platform disconnected from real-time dispatch socket");
    });
  }

  return socketInstance;
};
