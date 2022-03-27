import { Schema, model, ObjectId, Types } from 'mongoose';

interface Task {
    user: ObjectId;
    name: string;
    color: string;
    icon: string;
}

const schema = new Schema<Task>({
    user: { type: Types.ObjectId, required: true },
    name: { type: String, required: true },
    color: { type: String, required: true },
    icon: { type: String, required: true },
});

export const TaskModel = model<Task>('Task', schema);
