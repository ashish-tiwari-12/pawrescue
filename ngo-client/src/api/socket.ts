import { io, Socket } from "socket.io-client";

const isProd = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
const DEFAULT_PROD_SOCKET = "https://pawrescue-ebon.vercel.app";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isProd ? DEFAULT_PROD_SOCKET : "http://localhost:5000");

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
