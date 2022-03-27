import { Schema, model, ObjectId, Types } from 'mongoose';

interface TaskTime {
    user: ObjectId;
    task: ObjectId;
    start: Date;
    end: Date;
}

const schema = new Schema<TaskTime>({
    user: { type: Types.ObjectId, required: true },
    task: { type: Types.ObjectId, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: false },
});

export const TaskTimeModel = model<TaskTime>('TaskTime', schema);
