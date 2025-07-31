import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import User from "./models/user.js";

import routes from "./routes/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("DB Connected successfully."))
  .catch((err) => console.log("Failed to connect to DB:", err));

app.use(express.json());

const PORT = process.env.PORT || 5000;

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
      const Chat = (await import("./models/chat.js")).default;
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

      const { recordActivity } = await import("./libs/index.js");
      await recordActivity(socket.user._id, "sent_message", resourceType, resourceId, {
        description: `sent a message: ${message.substring(0, 50) + (message.length > 50 ? "..." : "")}`,
      });

      io.to(`${resourceType}:${resourceId}`).emit("message", populatedMessage);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user._id}`);
  });
});

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Welcome to TaskHub API",
  });
});

app.use("/api-v1", routes);

app.use((err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({
    message: "Not found",
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});