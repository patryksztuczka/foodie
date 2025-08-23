import express from 'express';
import cors from 'cors';

import { v1Router } from './routes/v1.js';

const app = express();
const port = Number(process.env.PORT) ?? 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.send('Hello World');
});

app.use('/api/v1', v1Router);

app.listen(port, '127.0.0.1', () => {
  console.log(`Server is running on port ${port}`);
});
