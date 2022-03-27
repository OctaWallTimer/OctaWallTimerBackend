import express, {Request, Response, NextFunction} from 'express';
import mongoose from 'mongoose';
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

app.post('/me', async (req: express.Request, res: express.Response) => {
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
    try{
        const tasks = await TaskModel.find({_id: req.body.task});
        if (tasks.length <= 0) {
            return res.send({
                success: false,
                error: 'Nie odnaleziono taska'
            });
        }
        task = tasks[0];
    }catch (e){
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

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});
