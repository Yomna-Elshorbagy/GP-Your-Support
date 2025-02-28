import { Router } from "express";
import * as userControllers from "./user.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { resetPassVal, signUpVal } from "./user.validation.js";
import { auth } from "../../middelwares/auth.js";

const userRouter = Router();

// auth routers
userRouter.post("/signup", validate(signUpVal), userControllers.signup);
userRouter.get("/verify/:token", userControllers.verifyAccount);
userRouter.post("/verifyOtp", userControllers.verifyOtp);
userRouter.put("/forgetPass", userControllers.forgetPassword);
userRouter.put("/changePass", userControllers.changePassword);
userRouter.post("/login", userControllers.logIn);
userRouter.post("/logout", auth, userControllers.logout);

// user routers
userRouter.get("/profile", auth, userControllers.getProfile);
userRouter.put(
  "/reset-pass",
  auth,
  validate(resetPassVal),
  userControllers.resetPassword
);
userRouter.put('/', auth , userControllers.updateUser )
userRouter.put("/softdelete", auth, userControllers.softDeleteUser);
userRouter.delete("/", auth, userControllers.deleteUser);


export default userRouter;
