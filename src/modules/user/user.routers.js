import { Router } from "express";
import * as userControllers from "./user.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { resetPassVal, signUpVal } from "./user.validation.js";
import { auth, isAuthorized } from "../../middelwares/auth.js";
import { uploadSingleFile } from "../../utils/fileUpload/multer-cloud.js";
import { roles } from "../../utils/constant/enums.js";

const userRouter = Router();

// auth routers
userRouter.post(
  "/signup",
  uploadSingleFile("image"),
  validate(signUpVal),
  userControllers.signup
);
userRouter.get("/verify/:token", userControllers.verifyAccount);
userRouter.post("/verifyOtp", userControllers.verifyOtp);
userRouter.put("/forgetPass", userControllers.forgetPassword);
userRouter.put("/changePass", userControllers.changePassword);
userRouter.post("/login", userControllers.logIn);
userRouter.post("/logout", auth, userControllers.logout);

// user routers
userRouter.get(
  "/",
  auth,
  isAuthorized([roles.ADMIN]),
  userControllers.getAllUsers
);
userRouter.get("/profile", auth, userControllers.getProfile);
userRouter.put(
  "/reset-pass",
  auth,
  validate(resetPassVal),
  userControllers.resetPassword
);
userRouter.put("/", auth, userControllers.updateUser);
userRouter.put("/softdelete", auth, userControllers.softDeleteUser);
userRouter.delete(
  "/",
  auth,
  isAuthorized([roles.ADMIN]),
  userControllers.deleteUser
);

//user data with products added
userRouter.get("/getproducts", auth, userControllers.getUserWithProducts);
userRouter.get(
  "/:userId",
  auth,
  isAuthorized([roles.ADMIN]),
  userControllers.getSpecificUser
);
userRouter.delete(
  "/deleteuser/:userId",
  auth,
  isAuthorized([roles.ADMIN]),
  userControllers.deleteUserByAdmin
);
export default userRouter;
