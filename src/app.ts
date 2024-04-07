import express from "express";
import cors from "cors";
import "./db/mongoose.js";
import { ingredientRouter } from "./routers/ingredient.routes.js";
import { defaultRouter } from "./routers/default.routes.js";

export const app = express();
app.use(express.json());
app.use(cors());
app.use(ingredientRouter);
app.use(defaultRouter);
