import express from "express";
import { getPublishedImages, getUser, loginUser, registerUser } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post('/api/register', registerUser)
userRouter.post('/api/login', loginUser)
userRouter.get('/api/data', protect, getUser)
userRouter.get('/api/published-images', getPublishedImages)

export default userRouter;