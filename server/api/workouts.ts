import express from 'express';
import { insertWorkout } from '../database';

const router = express.Router();

router.post('/workouts', async (req, res) => {
  try {
    const workoutData = req.body;
    const insertedWorkout = await insertWorkout(workoutData);
    res.status(201).json(insertedWorkout);
  } catch (error) {
    console.error('Insert workout error:', error);
    res.status(500).json({ error: 'Failed to insert workout' });
  }
});

export default router;
