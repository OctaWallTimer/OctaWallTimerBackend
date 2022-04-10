import express from "express";
import {AccountModel} from "../AccountModel";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

export const loginHandler = async (req: express.Request, res: express.Response) => {
    const name = req.body.name;
    if (!name || !req.body.password) {
        return res.send({
            success: false,
            error: "Brak loginu lub hasła"
        })
    }
    const user = await AccountModel.find({name});
    if (user.length <= 0 || !bcrypt.compareSync(req.body.password, user[0].password)) {
        return res.send({
            success: false,
            error: "Niepoprawny login lub hasło"
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
