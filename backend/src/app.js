import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Middlewares cơ bản
app.use(cors({
  origin(origin, callback) {
    const configured = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((value) => value.trim());
    const localDev = process.env.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1):(3000|5173|5174)$/.test(origin || '');
    callback(null, !origin || configured.includes(origin) || localDev);
  },
  credentials: true,
}));
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Wedding Dress Rental API is running' });
});

app.use(errorHandler);

export default app;
