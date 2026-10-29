import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import orderRoutes from './routes/order.routes.js';
import contractTemplateRoutes from './routes/contractTemplate.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Cấu hình CORS cho phép cả cổng 5173 (Vite) và 3000
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Trong môi trường dev cho phép pass
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Wedding Dress Rental API is running' });
});

// Gắn các Routers API
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);

// Bắt lỗi tập trung
app.use(errorHandler);

export default app;
