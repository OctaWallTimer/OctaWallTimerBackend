import { Schema, model, ObjectId, Types } from 'mongoose';

interface TimeTableShare {
    user: ObjectId;
    mode: string;
    offset: string;
}

const schema = new Schema<TimeTableShare>({
    user: { type: Types.ObjectId, required: true },
    mode: { type: String, required: true },
    offset: { type: String, required: true },
});

export const TimeTableShareModel = model<TimeTableShare>('TimeTableShare', schema);