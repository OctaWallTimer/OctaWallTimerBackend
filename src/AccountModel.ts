import { Schema, model } from 'mongoose';

interface Account {
    name: string;
    password: string;
}

const schema = new Schema<Account>({
    name: { type: String, required: true },
    password: { type: String, required: true },
});

export const AccountModel = model<Account>('Account', schema);