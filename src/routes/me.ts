import express from "express";
import {AccountDB} from "../AccountModel";

export const meHandler = async (req: express.Request, res: express.Response) => {
    const user: AccountDB = req.user;
    delete user.password;
    res.send({
        success: true,
        user: user,
    })
};
