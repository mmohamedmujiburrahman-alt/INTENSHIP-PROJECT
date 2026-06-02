import 'dotenv/config'
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import { inngest, functions } from './inngest/index.js';
import { serve } from 'inngest/express';
import { clerkMiddleware } from '@clerk/express';

import userRouter from './routes/userRotes.js';
import storyRouter from './routes/storyRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import postRouter from './routes/postRoutes.js';

const app = express();

await connectDB();

app.use(cors());
app.use(express.json());

app.use(clerkMiddleware());

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.use('/api/inngest', serve({ client: inngest, functions }));

app.use('/api/user', userRouter);
app.use('/api/post', postRouter);
app.use('/api/story', storyRouter);
app.use('/api/message', messageRouter);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});