import express from "express";
import { googleAuth, googleAuthCallback, googleAuthSuccess, loginWithOAuth, signupWithOAuth } from "./auth.controllers.js";

const authRouter = express.Router();

authRouter.get("/auth/google", googleAuth);
authRouter.get("/auth/google/callback", googleAuthCallback, googleAuthSuccess);


authRouter.post('/signup-oauth', signupWithOAuth)
authRouter.post('/login-oauth', loginWithOAuth)
export default authRouter;
