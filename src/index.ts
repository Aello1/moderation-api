import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express'
import moderationRouter from './routes/moderation.route';
import { errorHandler } from './middleware/errorHandler';
import { swaggerSpec } from './swagger';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(rateLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Moderation API is running.' });
});

app.use('/api', moderationRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});