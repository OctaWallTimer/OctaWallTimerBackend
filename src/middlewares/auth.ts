import express from "express";
import * as jwt from "jsonwebtoken";
import {AccountModel} from "../AccountModel";

export const authMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    let token = "";
    if (req.params.token) token = req.params.token;
    if (req.body.token) token = req.body.token;
    if (req.headers.authorization) {
        if (req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.substring("Bearer ".length);
        }
    }
    if (!token) {
        return res.status(500).send({
            success: false,
            error: 'Endpoint wymaga tokenu'
        })
    }
    const data = jwt.decode(token) as { user: string } | null;
    if (!data) {
        return res.status(500).send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    const user = await AccountModel.find({name: data.user});
    if (user.length <= 0) {
        return res.status(500).send({
            success: false,
            error: "Niepoprawny token"
        })
    }
    req.user = user[0];
    return next();

}
