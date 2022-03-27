import {AccountDB} from "../AccountModel";
import { Request } from "express"

declare module "express" {
    export interface Request {
        user?: AccountDB
    }
}
