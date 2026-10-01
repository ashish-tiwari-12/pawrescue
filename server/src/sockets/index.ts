import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";
import { logSecurityEvent } from "../services/securityLogger.js";

let io: SocketIOServer | null = null;

interface SocketUser {
  id: string;
  email?: string;
  role: string;
  ngoId?: string;
}

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed =
          ENV.ALLOWED_ORIGINS.includes(origin) ||
          origin.endsWith(".vercel.app") ||
          origin.includes("localhost") ||
          origin.includes("127.0.0.1");
        if (isAllowed) {
          callback(null, true);
        } else {
          callback(new Error("Socket CORS origin blocked"));
        }
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "") ||
      socket.handshake.query?.token;

    if (token && typeof token === "string") {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as SocketUser;
        (socket as any).user = decoded;
      } catch (err: any) {
        logSecurityEvent({
          eventType: "AUTH_FAILED",
          details: `Socket connection token invalid: ${err.message}`
        });
      }
    }
    // Allow connection (unauthenticated sockets can receive general public updates, but cannot join private rooms)
    next();
  });

  io.on("connection", (socket) => {
    const authenticatedUser = (socket as any).user as SocketUser | undefined;

    // Join room for specific role or user with authorization check
    socket.on("join", (data: { userId?: string; role?: string }) => {
      // 1. Role-based room check
      if (data?.role) {
        if (authenticatedUser && authenticatedUser.role === data.role) {
          socket.join(`role:${data.role}`);
        } else if (data.role === "citizen") {
          socket.join(`role:citizen`);
        } else {
          logSecurityEvent({
            eventType: "UNAUTHORIZED_ACCESS",
            details: `Unauthorized attempt to join socket room 'role:${data.role}' by unauthenticated or mismatched socket.`
          });
        }
      }

      // 2. User-specific room check
      if (data?.userId) {
        if (authenticatedUser && (authenticatedUser.id === data.userId || authenticatedUser.role === "ngo_admin")) {
          socket.join(`user:${data.userId}`);
        } else if (!authenticatedUser && data.userId.startsWith("anon-")) {
          socket.join(`user:${data.userId}`);
        } else {
          logSecurityEvent({
            eventType: "UNAUTHORIZED_ACCESS",
            details: `Unauthorized attempt to join private socket room 'user:${data.userId}'`
          });
        }
      }
    });

    socket.on("disconnect", () => {
      // Clean disconnect
    });
  });

  return io;
};

export const broadcastEvent = (event: string, payload: any) => {
  if (io) {
    io.emit(event, payload);
  }
};
