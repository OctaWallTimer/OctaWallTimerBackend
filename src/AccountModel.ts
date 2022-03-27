import {Schema, model, ObjectId, Types, Document} from 'mongoose';

interface Account {
    name: string;
    password: string;
}
export type AccountDB =  Document<unknown, any, Account> & Account & {_id: Types.ObjectId};

const schema = new Schema<Account>({
    name: { type: String, required: true },
    password: { type: String, required: true },
});

export const AccountModel = model<Account>('Account', schema);
