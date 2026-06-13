import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes/api.routes';
import { auditLogger } from './middleware/audit.middleware';
import { connectMongo } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (Commented out to run cleanly on local JSON fallbacks if MongoDB is not running)
// connectMongo();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' })); // support large Base64 document uploads
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Serve static uploaded medical documents securely
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Global Audit logging middleware for mutations and security alerts
app.use(auditLogger);

// Mounting Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date() });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER_ERROR]', err);
  return res.status(err.status || 500).json({
    message: err.message || 'Internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  HMS Secure Backend running on port ${PORT}`);
  console.log(`==================================================\n`);
});

export default app;
