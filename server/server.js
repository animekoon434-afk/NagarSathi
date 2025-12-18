import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Import configurations
import connectDB from './config/db.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import issueRoutes from './routes/issueRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import upvoteRoutes from './routes/upvoteRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import geocodeRoutes from './routes/geocodeRoutes.js';

// Import error handlers
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// ============================================
// MIDDLEWARE
// ============================================

// CORS configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'NagarSathi API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api', commentRoutes); // Comments and upvotes are nested under /api/issues/:issueId
app.use('/api/issues', upvoteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/geocode', geocodeRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🏛️  NagarSathi API Server                                ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV?.padEnd(42)}║
║   Port: ${PORT.toString().padEnd(50)}║
║   API URL: http://localhost:${PORT}/api                     ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err.message);
    // Close server & exit process
    server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
});

export default app;
