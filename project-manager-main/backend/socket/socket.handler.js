import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../modules/auth/models/user.js";
import activityLogService from "../services/activity-log.service.js";
import Chat from "../modules/chat/models/chat.js";

const initializeSocket = (server) => {
    const io = new Server(server, {
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
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
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

        socket.on("joinRoom", ({ resourceType, resourceId }) => {
            const room = `${resourceType}:${resourceId}`;
            socket.join(room);
            console.log(`User ${socket.user._id} joined room ${room}`);
        });

        socket.on("sendMessage", async ({ resourceType, resourceId, message }) => {
            try {
                const newMessage = await Chat.create({
                    resourceType,
                    resourceId,
                    sender: socket.user._id,
                    message,
                });

                const populatedMessage = await Chat.findById(newMessage._id).populate(
                    "sender",
                    "name profilePicture"
                );

                await activityLogService.recordActivity(
                    socket.user._id,
                    "sent_message",
                    resourceType,
                    resourceId,
                    {
                        description: `sent a message: ${message.substring(0, 50) + (message.length > 50 ? "..." : "")
                            }`,
                    }
                );

                io.to(`${resourceType}:${resourceId}`).emit("message", populatedMessage);
            } catch (error) {
                console.log(error);
            }
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user._id}`);
        });
    });

    return io;
};

export default initializeSocket;
