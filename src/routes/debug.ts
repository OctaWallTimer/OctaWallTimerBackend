import express from "express";
import {AccountDB} from "../AccountModel";
import {TaskTimeModel} from "../TaskTimeModel";
import {TaskModel} from "../TaskModel";

export const fillTimeHandler = async (req: express.Request, res: express.Response) => {
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
}
