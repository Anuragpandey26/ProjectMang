import { Server } from "socket.io";
import User from "../modules/auth/models/user.js";
import chatService from "../modules/chat/services/chat.service.js";
import tokenService from "./token.service.js";

let io;

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token?.split(" ")[1];
            if (!token) {
                return next(new Error("Authentication error"));
            }

            const decoded = tokenService.verifyAccessToken(token);
            const user = await User.findById(decoded.sub);
            if (!user) {
                return next(new Error("Authentication error"));
            }
            socket.user = user;
            next();
        } catch (error) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user._id}`);
        
        // Join a private room for personal notifications
        socket.join(`user:${socket.user._id}`);

        socket.on("joinRoom", ({ resourceType, resourceId }) => {
            const room = `${resourceType}:${resourceId}`;
            socket.join(room);
            console.log(`User ${socket.user._id} joined room ${room}`);
        });

        socket.on("sendMessage", async ({ resourceType, resourceId, message }) => {
            try {
                const newMessage = await chatService.sendMessage(socket.user._id, {
                    resourceType,
                    resourceId,
                    message,
                });

                io.to(`${resourceType}:${resourceId}`).emit("message", newMessage);
            } catch (error) {
                console.error("Socket sendMessage error:", error.message);
                socket.emit("error", { message: error.message });
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user._id}`);
        });
    });

    return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export default initializeSocket;
