import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import http from "http";
import initializeSocket from "./socket/socket.handler.js";
import connectDB from "./db/connect.js";
import routes from "./routes/api.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

connectDB();
initializeSocket(server);

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get("/", async (req, res) => {
  res.status(200).json({
    message: "Welcome to Catalyst API",
    tagline: "Accelerate Your Team's Productivity",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api-v1/health",
      auth: "/api-v1/auth",
      workspaces: "/api-v1/workspaces",
      projects: "/api-v1/projects",
      tasks: "/api-v1/tasks",
      users: "/api-v1/users",
      chat: "/api-v1/chat",
    },
    documentation: "https://docs.catalyst.app",
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
  console.log(`🚀 Catalyst API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api-v1/health`);
  console.log(`📖 API docs: http://localhost:${PORT}/`);
});