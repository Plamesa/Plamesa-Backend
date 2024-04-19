import express from "express";
import cors from "cors";
import "./db/mongoose.js";
import { ingredientRouter } from "./routers/ingredient.routes.js";
import { defaultRouter } from "./routers/default.routes.js";
import { recipeRouter } from "./routers/recipe.routes.js";
import { userRouter } from "./routers/user.routes.js";
import { loginRouter } from "./routers/login.routes.js";

export const app = express();
app.use(express.json());
app.use(cors());
app.use(ingredientRouter);
app.use(recipeRouter);
app.use(userRouter);
app.use(loginRouter);
app.use(defaultRouter);
