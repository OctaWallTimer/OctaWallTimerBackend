import express from "express";
import {AccountModel} from "../AccountModel";
import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

export const registerHandler = async (req: express.Request, res: express.Response) => {
    const name = req.body.name;
    if (!name || !req.body.password) {
        return res.send({
            success: false,
            error: "Brak loginu lub hasła"
        })
    }
    const user = await AccountModel.find({name});
    if (user.length > 0) {
        return res.send({
            success: false,
            error: "Użytkownik już istnieje"
        })
    }
    const password = bcrypt.hashSync(req.body.password, 10);
    const model = new AccountModel({
        name, password
    })
    await model.save();
    const accessToken = jwt.sign({user: name}, process.env.JWT_KEY, {
        expiresIn: '1d',
    });
    const refreshToken = jwt.sign({user: name}, process.env.JWT_KEY, {
        expiresIn: '31d',
    });
    res.send({
        success: true,
        accessToken,
        refreshToken
    })
}
