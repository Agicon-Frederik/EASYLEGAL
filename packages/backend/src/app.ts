import express, { Request, Response } from "express";
import cors from "cors";
import i18next, { i18nextMiddleware } from "./i18n";
import { database } from "./database/db";
import { prisma, initializeDefaultUsers } from "./database/prisma";
import { emailService } from "@easylegal/common";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";

const app = express();

// Enable CORS for frontend
// Support multiple origins (localhost for dev, production domain)
const allowedOrigins = [
  "http://localhost:5173",
  "https://easylegal.agicon.cloud",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Add i18n middleware
app.use(i18nextMiddleware);

// Initialize services
async function initializeServices() {
  try {
    // Initialize old database (keeping for backward compatibility with auth routes)
    await database.initialize();
    console.log("✓ Legacy database initialized");

    // Initialize Prisma and seed default users
    await initializeDefaultUsers();
    console.log("✓ Prisma database initialized with default users");

    // Initialize email service
    const emailConfig = {
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER || "",
        pass: process.env.EMAIL_PASS || "",
      },
    };

    if (emailConfig.auth.user && emailConfig.auth.pass) {
      emailService.initialize(emailConfig);
      console.log("✓ Email service initialized");
    } else {
      console.warn(
        "⚠ Email service not configured. Set EMAIL_USER and EMAIL_PASS environment variables."
      );
    }
  } catch (error) {
    console.error("Failed to initialize services:", error);
  }
}

// Only initialize services if not in test mode
if (process.env.NODE_ENV !== "test") {
  initializeServices();
}

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).send("The API is running");
});

// Example i18n endpoint
app.get("/api/welcome", (req: Request, res: Response) => {
  const message = req.t("messages.welcome", { appName: req.t("app.name") });
  res.json({ message });
});

// Auth routes
app.use("/api/auth", authRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

export default app;
