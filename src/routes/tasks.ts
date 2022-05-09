import express from "express";
import {AccountDB} from "../AccountModel";
import {TaskModel} from "../TaskModel";

export const getTasksHandler = async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const tasks = await TaskModel.find({user: user._id});
    return res.send({
        success: true,
        tasks
    });
}

export const postTasksHandler = async (req: express.Request, res: express.Response) => {
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
}

export const updateTasksHandler = async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const task = await TaskModel.findOne({_id: req.params.id, user: user._id});
    if(!task){
        return res.send({
            success: false,
            error: "Nie odnaleziono zadania!"
        })
    }
    if(req.body.name) task.name = req.body.name;
    if(req.body.color) task.color = req.body.color;
    if(req.body.icon) task.icon = req.body.icon;
    await task.save();
    return res.send({
        success: true,
        task
    });
}
