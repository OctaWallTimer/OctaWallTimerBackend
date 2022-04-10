import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import {authMiddleware} from "./middlewares/auth";
import {registerHandler} from './routes/register';
import {loginHandler} from './routes/login';
import {refreshHandler} from './routes/refresh';
import {meHandler} from './routes/me';
import {getTasksHandler, postTasksHandler} from "./routes/tasks";
import {getTimeHandler, postTimeHandler} from "./routes/time";
import {getTimeTableHandler} from './routes/timetable';
import {fillTimeHandler} from './routes/debug';

require('dotenv').config()

mongoose.connect(process.env.MONGO);

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('OctaWallTimer!');
});

app.post('/register', registerHandler)
app.post('/login', loginHandler)
app.post('/refresh', refreshHandler)
app.post('/me', authMiddleware, meHandler)

app.get('/tasks', authMiddleware, getTasksHandler)
app.post('/tasks', authMiddleware, postTasksHandler)
app.get('/time', authMiddleware, getTimeHandler)
app.post('/time', authMiddleware, postTimeHandler)
app.post('/debug/time', authMiddleware, fillTimeHandler)
app.get('/timetable', authMiddleware, getTimeTableHandler)

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
