import express, {Request, Response, NextFunction} from 'express';
import mongoose, {ObjectId} from 'mongoose';
import * as jwt from 'jsonwebtoken';
import {AccountDB, AccountModel} from "./AccountModel";

require('dotenv').config()
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import {TaskModel} from "./TaskModel";
import {TaskTimeModel} from "./TaskTimeModel";


mongoose.connect(process.env.MONGO);

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT;

const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let token = "";
    if (req.params.token) token = req.params.token;
    if (req.body.token) token = req.body.token;
    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.substring("Bearer ".length);
        }
    }
    if (!token) {
        return res.status(500).send({
            success: false,
            error: 'Endpoint wymaga tokenu'
        })
    }
    const data = jwt.decode(token) as { user: string } | null;
    if (!data) {
        return res.status(500).send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    const user = await AccountModel.find({name: data.user});
    if (user.length <= 0) {
        return res.status(500).send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    req.user = user[0];
    return next();

}

app.get('/', (req: express.Request, res: express.Response) => {
    res.send('OctaWallTimer!');
});

app.post('/register', async (req: express.Request, res: express.Response) => {
    const name = req.body.name;
    if (!name || !req.body.password) {
        return res.send({
            success: false,
            error: "Brak loginu lub hasła"
        })
    }
    const user = await AccountModel.find({name});
    if (user.length > 0) {
        return res.send({
            success: false,
            error: "Użytkownik już istnieje"
        })
    }
    const password = bcrypt.hashSync(req.body.password, 10);
    const model = new AccountModel({
        name, password
    })
    await model.save();
    const accessToken = jwt.sign({user: name}, process.env.JWT_KEY, {
        expiresIn: '1d',
    });
    const refreshToken = jwt.sign({user: name}, process.env.JWT_KEY, {
        expiresIn: '31d',
    });
    res.send({
        success: true,
        accessToken,
        refreshToken
    })
})

app.post('/login', async (req: express.Request, res: express.Response) => {
    const name = req.body.name;
    if (!name || !req.body.password) {
        return res.send({
            success: false,
            error: "Brak loginu lub hasła"
        })
    }
    const user = await AccountModel.find({name});
    if (user.length <= 0 || !bcrypt.compareSync(req.body.password, user[0].password)) {
        return res.send({
            success: false,
            error: "Niepoprawny login lub hasło"
        })
    }
    const accessToken = jwt.sign({user: user[0].name}, process.env.JWT_KEY, {
        expiresIn: '1d',
    });
    const refreshToken = jwt.sign({user: user[0].name}, process.env.JWT_KEY, {
        expiresIn: '31d',
    });
    res.send({
        success: true,
        accessToken,
        refreshToken
    })
})

app.post('/refresh', async (req: express.Request, res: express.Response) => {
    const token = req.body.token;
    if (!token) {
        return res.send({
            success: false,
            error: "Brak tokenu"
        })
    }
    const data = jwt.decode(token) as { user: string } | null;
    if (!data) {
        return res.send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    const user = await AccountModel.find({name: data.user});
    if (user.length <= 0) {
        return res.send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    const accessToken = jwt.sign({user: user[0].name}, process.env.JWT_KEY, {
        expiresIn: '1d',
    });
    const refreshToken = jwt.sign({user: user[0].name}, process.env.JWT_KEY, {
        expiresIn: '31d',
    });
    res.send({
        success: true,
        accessToken,
        refreshToken
    })
})

app.post('/me', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    delete user.password;
    res.send({
        success: true,
        user: user,
    })
})

app.get('/tasks', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const tasks = await TaskModel.find({user: user._id});
    return res.send({
        success: true,
        tasks
    });
})
app.post('/tasks', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    if (!req.body.name ||
        !req.body.color ||
        !req.body.icon) {
        return res.send({
            success: false,
            error: 'Brak nazwy, koloru lub ikony'
        });
    }
    let task = new TaskModel({
        user: user._id,
        name: req.body.name,
        color: req.body.color,
        icon: req.body.icon,
    })
    await task.save();
    return res.send({
        success: true,
        task
    });
})
app.get('/time', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const time = await TaskTimeModel.find({user: user._id});
    return res.send({
        success: true,
        time
    });
})
app.post('/time', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    await TaskTimeModel.updateMany({user: user._id, end: null}, {end: new Date()});
    if (!req.body.task) {
        return res.send({
            success: false,
            error: 'Brak id taska'
        });
    }
    let task = null;
    try {
        const tasks = await TaskModel.find({_id: req.body.task});
        if (tasks.length <= 0) {
            return res.send({
                success: false,
                error: 'Nie odnaleziono taska'
            });
        }
        task = tasks[0];
    } catch (e) {
        return res.status(500).send({
            success: false,
            error: 'Podano błędne id taska'
        })
    }
    let time = new TaskTimeModel({
        user: user._id,
        task: task._id,
        start: new Date(),
        end: null
    })
    await time.save();
    return res.send({
        success: true,
        time
    });
})
app.post('/debug/time', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    await TaskTimeModel.updateMany({user: user._id, end: null}, {end: new Date()});
    const tasks = await TaskModel.find();
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        for (let day = 1; day < 7; day++) {
            for (let z = 0; z < 10; z++) {
                let start = new Date();
                start.setDate(start.getDate() - day);
                start.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
                let end = new Date(start.getTime() + (Math.random() / 2 + 0.5) * 60 * 60 * 1000);

                let time = new TaskTimeModel({
                    user: user._id,
                    task: task._id,
                    start: start,
                    end: end
                });

                await time.save();
            }
        }
    }
    return res.send({
        success: true
    });
})
app.get('/timetable', authMiddleware, async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const mode = req.query.mode || 'day';
    const times = await TaskTimeModel.find({user: user._id});
    let data: {start: number, end: number, tasks: { [task: string]: number }}[] = [];
    const getBetween = (start: Date, end: Date) => {
        let values: { [name: string]: number } = {};
        for (let i = 0; i < times.length; i++) {
            const time = times[i];
            const task = time.task.toString();
            if (!(task in values)) {
                values[task] = 0;
            }
            if(time.end == null){
                continue;
            }
            if (time.start.getTime() >= start.getTime() && (time.end.getTime() <= end.getTime())) {
                values[task] += (time.end.getTime()) - time.start.getTime();
            } else if (time.start.getTime() >= start.getTime() && time.start.getTime() <= end.getTime()) {
                values[task] += end.getTime() - time.start.getTime();
            } else if (time.end.getTime() >= start.getTime() && time.end.getTime() <= end.getTime()) {
                values[task] += time.end.getTime() - start.getTime();
            }
        }
        return {
            start: start.getTime(),
            end: end.getTime(),
            tasks: values
        };
    }
    switch (mode) {
        case 'day':
            for (let hour = 0; hour < 23; hour++) {
                const start = new Date();
                start.setHours(hour, 0, 0, 0);
                const end = new Date();
                end.setHours(hour, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
        case 'week':
            for (let day = 0; day < 7; day++) {
                const start = new Date();
                start.setDate(start.getDate() - 6 + day);
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setDate(end.getDate() - 6 + day);
                end.setHours(23, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
        case 'month':
            for (let day = 0; day < 31; day++) {
                const start = new Date();
                start.setDate(start.getDate() - 30 + day);
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setDate(end.getDate() - 30 + day);
                end.setHours(23, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
        case 'year':
            for (let month = 0; month < 12; month++) {
                const start = new Date();
                start.setMonth(month, 1)
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setMonth(month + 1, 1)
                end.setHours(23, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
    }
    return res.send({
        success: true,
        data
    });
})

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
