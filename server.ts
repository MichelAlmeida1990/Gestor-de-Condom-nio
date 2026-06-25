import express from "express";
import { createServer as createViteServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import { initDB } from "./server/database.js";
import authRoutes from "./server/routes/auth.js";
import expensesRoutes from "./server/routes/expenses.js";
import incomeRoutes from "./server/routes/income.js";
import notificationsRoutes from "./server/routes/notifications.js";
import usersRoutes from "./server/routes/users.js";
import occurrencesRoutes from "./server/routes/occurrences.js";
import transparencyRoutes from "./server/routes/transparency.js";
import reservationsRoutes from "./server/routes/reservations.js";
import { rateLimit, errorHandler } from "./server/middleware.js";

const PORT = parseInt(process.env.PORT || "3000");

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:5175"];

const CORS_ORIGINS = [...ALLOWED_ORIGINS, /\.vercel\.app$/, /\.onrender\.com$/];

async function startServer() {
  await initDB();

  const app = express();
  // Simple request logger for debugging (masks password fields)
  app.use((req, _res, next) => {
    try {
      const body = (req as any).body;
      let safeBody = body;
      if (body && typeof body === "object") {
        safeBody = { ...body };
        if (safeBody.password) safeBody.password = "***";
      }
      console.log(`[REQ] ${req.method} ${req.path} origin=${req.headers.origin || "none"} ${Object.keys(safeBody || {}).length ? JSON.stringify(safeBody) : ''}`);
    } catch (e) {
      /* ignore logging errors */
    }
    next();
  });
  app.use(express.json({ limit: "10mb" }));

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      console.log("[CORS] origin:", origin);
      if (!origin) {
        return callback(null, true);
      }
      const allowed = CORS_ORIGINS.some((item) => typeof item === "string" ? item === origin : item.test(origin));
      if (allowed) {
        return callback(null, true);
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));

  // Set correct MIME types for JavaScript modules
  app.use((req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    next();
  });
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // API Routes
  app.use("/api/auth", rateLimit, authRoutes);
  app.use("/api/expenses", rateLimit, expensesRoutes);
  app.use("/api/income", rateLimit, incomeRoutes);
  app.use("/api/notifications", rateLimit, notificationsRoutes);
  app.use("/api", rateLimit, usersRoutes);
  app.use("/api/occurrences", rateLimit, occurrencesRoutes);
  app.use("/api/transparency", rateLimit, transparencyRoutes);
  app.use("/api/reservations", rateLimit, reservationsRoutes);

  // Global error handler
  app.use(errorHandler);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: process.cwd(),
      configFile: false,
      server: { middlewareMode: true },
      appType: "spa",
      plugins: [react(), tailwindcss()],
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
      }
    }));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server running on http://localhost:${PORT}`));
}

startServer();
