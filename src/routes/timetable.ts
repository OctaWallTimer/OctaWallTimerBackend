import express from "express";
import {AccountDB, AccountModel} from "../AccountModel";
import {TaskTimeModel} from "../TaskTimeModel";
import {TimeTableShareModel} from "../TimeTableShareModel";
import {Task, TaskModel} from "../TaskModel";
import {ObjectId, Types} from "mongoose";

interface TimeTable{
    start: number;
    end: number;
    tasks: {
        [task: string]: number;
    }
}

async function getTimeTable(user: AccountDB, mode: string, offset: number): Promise<TimeTable[]> {
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

type ChartTimeTable = {
    day: string;
    time: number;
}
const pad: (a: number) => string = d => d.toString().padStart(2, '0');
const getChartData = (timeTableMode: string, tasks: (Task & { _id: Types.ObjectId })[], timeTable: TimeTable[]) => {
    let ret: { name: string, data: ChartTimeTable[] }[] = [];
    for (let taskId = 0; taskId < tasks.length; taskId++) {
        const task = tasks[taskId];
        let data = [];
        switch (timeTableMode) {
            case 'day':
                for (let hour = 0; hour < 23; hour++) {
                    data.push({
                        day: `${hour < 10 ? '0' + hour : hour}:00:00`,
                        time: timeTable[hour].tasks[`${task._id}`] ?? 0
                    })
                }
                break;
            case 'week':
                for (let day = 0; day < 7; day++) {
                    const start = new Date();
                    start.setDate(start.getDate() - 6 + day);
                    data.push({
                        day: ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sb"][start.getDay()],
                        time: timeTable[day].tasks[`${task._id}`] ?? 0
                    })
                }
                break;
            case 'month':
                for (let week = 0; week < timeTable.length; week++) {
                    const start = new Date(timeTable[week].start);
                    const end = new Date(timeTable[week].end);
                    data.push({
                        day: `${pad(start.getDate())}.${pad(start.getMonth())}`,
                        time: timeTable[week].tasks[`${task._id}`] ?? 0
                    })
                }
                break;
            case 'year':
                for (let month = 0; month < 12; month++) {
                    const start = new Date();
                    start.setMonth(month, 1)
                    start.setHours(0, 0, 0, 0);
                    data.push({
                        day: `${month}`,
                        time: timeTable[month].tasks[`${task._id}`] ?? 0
                    })
                }
                break;
        }
        ret.push({
            name: task.name,
            data
        })
    }
    return ret;
}


export const shareRenderHandler = async (req: express.Request, res: express.Response) => {
    const shared = await TimeTableShareModel.findById(req.params.id);
    const user: AccountDB = await AccountModel.findById(shared.user);
    const mode = shared.mode;
    const offset = parseInt(shared.offset);
    const data = await getTimeTable(user, mode, offset);

    const tasks = await TaskModel.find({user: user._id});
    const chartData = getChartData(mode, tasks, data);
    return res.render('../share.html',{user: user.name, mode, offset, data: chartData});
}