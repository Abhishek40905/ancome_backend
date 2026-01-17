import e from "express";
import router from "./index.js";
import cookieParser from "cookie-parser";
import cors from "cors"
const app = e();
app.use(cookieParser())
app.use(e.json())
app.use(
  cors({
    // Use an environment variable, fallback to localhost for dev
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(e.urlencoded({extended:true,limit:"16kb"}))

app.use('/api',router)

export default app;

