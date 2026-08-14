import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import healthRouter from './modules/health/health.route';
import authRouter from "./modules/auth/auth.routes";
import chatRequestRoutes from "./modules/chat-request/chat-request.routes";
import conversationRoutes from "./modules/conversation/conversation.routes";
import messagesRoutes from "./modules/message/message.routes";
import userRoutes from "./modules/users/user.routes";
import pushRoutes from "./modules/push-notifications/push-notifications.routes";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());

app.use("/api/health", healthRouter);

app.use("/api/auth", authRouter);

app.use("/api/chat-requests", chatRequestRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/conversations", messagesRoutes);

app.use("/api/users", userRoutes);

app.use("/api/push-notifications",pushRoutes);

export default app;