import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import apiRouter from "./routes/index.js";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Backend running" });
});

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
