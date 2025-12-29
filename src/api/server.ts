import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', apiRoutes);

export const startApiServer = () => {
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
  });
};
