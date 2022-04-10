import express from "express";
import * as jwt from "jsonwebtoken";
import {AccountModel} from "../AccountModel";

export const refreshHandler = async (req: express.Request, res: express.Response) => {
    const token = req.body.token;
    if (!token) {
        return res.send({
            success: false,
            error: "Brak tokenu"
        })
    }
    const data = jwt.decode(token) as { user: string } | null;
    if (!data) {
        return res.send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    const user = await AccountModel.find({name: data.user});
    if (user.length <= 0) {
        return res.send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    const accessToken = jwt.sign({user: user[0].name}, process.env.JWT_KEY, {
        expiresIn: '1d',
    });
    const refreshToken = jwt.sign({user: user[0].name}, process.env.JWT_KEY, {
        expiresIn: '31d',
    });
    res.send({
        success: true,
        accessToken,
        refreshToken
    })
}
