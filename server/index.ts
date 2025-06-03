import express from 'express';
import cors from 'cors';
import workoutsRouter from './api/workouts';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
}));

app.use(express.json());
app.use('/api', workoutsRouter);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
