import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/gbrc',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  ewmaAlpha: parseFloat(process.env.EWMA_ALPHA || '0.5'),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  thresholds: {
    warning: 0.70,
    quarantine: 0.80,
    slashed: 0.90,
  },
};
