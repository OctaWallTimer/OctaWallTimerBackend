import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import path from 'path';
import ejs from 'ejs';

import {authMiddleware} from "./middlewares/auth";
import {registerHandler} from './routes/register';
import {loginHandler} from './routes/login';
import {refreshHandler} from './routes/refresh';
import {meHandler} from './routes/me';
import {getTasksHandler, postTasksHandler, updateTasksHandler} from "./routes/tasks";
import {getTimeHandler, postTimeHandler} from "./routes/time";
import {getTimeTableHandler, shareLinkHandler, shareRenderHandler} from './routes/timetable';
import {fillTimeHandler} from './routes/debug';

require('dotenv').config()

mongoose.connect(process.env.MONGO);

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;

app.engine('html', ejs.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('OctaWallTimer!');
});

app.post('/register', registerHandler);
app.post('/login', loginHandler);
app.post('/refresh', refreshHandler);
app.post('/me', authMiddleware, meHandler);

app.get('/tasks', authMiddleware, getTasksHandler);
app.post('/tasks', authMiddleware, postTasksHandler);
app.post('/tasks/:id', authMiddleware, updateTasksHandler);
app.get('/time', authMiddleware, getTimeHandler);
app.post('/time', authMiddleware, postTimeHandler);
app.post('/debug/time', authMiddleware, fillTimeHandler);
app.get('/timetable', authMiddleware, getTimeTableHandler);
app.post('/share', authMiddleware, shareLinkHandler);
app.get('/share/:id', shareRenderHandler);


app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});