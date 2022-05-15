import express from "express";
import {AccountDB} from "../AccountModel";
import {TaskTimeModel} from "../TaskTimeModel";
import {TimeTableShareModel} from "../TimeTableShareModel";

async function getTimeTable(user: AccountDB, mode: string, offset: number) {
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
                start.setDate(start.getDate() - offset);
                start.setHours(hour, 0, 0, 0);
                const end = new Date();
                end.setDate(end.getDate() - offset);
                end.setHours(hour, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
        case 'week':
            for (let day = 0; day < 7; day++) {
                const start = new Date();
                start.setDate(start.getDate() - 6 + day - 7*offset);
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setDate(end.getDate() - 6 + day - 7*offset);
                end.setHours(23, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
        case 'month':{
            const start = new Date();
            const month = start.getMonth() - offset;
            start.setMonth(month);
            start.setDate(2-start.getDay());
            if(start.getDate() != 1 && month == start.getMonth()){
                start.setDate(start.getDate()-7);
            }
            start.setHours(0, 0, 0, 0);

            const end = new Date(start);
            end.setDate(end.getDate() + 6);
            end.setHours(23, 59, 59, 999);

            while (start.getMonth() <= month) {
                data.push(getBetween(start, end));
                start.setDate(start.getDate() + 7);
                end.setDate(end.getDate() + 7);
            }
            break;
        }
        case 'year':
            for (let month = 0; month < 12; month++) {
                const start = new Date();
                start.setFullYear(start.getFullYear() - offset);
                start.setMonth(month, 1)
                start.setHours(0, 0, 0, 0);
                const end = new Date();
                end.setFullYear(end.getFullYear() - offset);
                end.setMonth(month + 1, 1)
                end.setHours(23, 59, 59, 999);
                data.push(getBetween(start, end));
            }
            break;
    }
    return data;
}

export const getTimeTableHandler = async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const mode: string = (req.query.mode || 'day') as string;
    const offset = parseInt((req.query.offset || '0') as string);
    const data = await getTimeTable(user, mode, offset);

    return res.send({
        success: true,
        data
    });
}

export const shareLinkHandler = async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    const mode = req.query.mode || 'day';
    const offset = parseInt((req.query.offset || '0') as string);
    const share = new TimeTableShareModel({
        user,
        mode,
        offset,
    });
    await share.save();

    return res.send({
        success: true,
        link: process.env.BASE_URL + "/share/" + share._id
    })
}