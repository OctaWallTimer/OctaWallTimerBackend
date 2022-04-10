import express from "express";
import {AccountDB} from "../AccountModel";
import {TaskTimeModel} from "../TaskTimeModel";
import {TaskModel} from "../TaskModel";

export const getTimeHandler = async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const time = await TaskTimeModel.find({user: user._id});
    return res.send({
        success: true,
        time
    });
}

export const postTimeHandler = async (req: express.Request, res: express.Response) => {
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
}
