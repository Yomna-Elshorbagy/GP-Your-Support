import { dbConnection } from "../../database/dbconnection.js";
import { AppError } from "../utils/catch-error.js";
import { globalError } from "../utils/global-error.js";
import * as allRouters from "./index.js";

import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "../utils/oAuth/passport.js"

export const bootstrap = (app) => {
  process.on("uncaughtException", (err) => {
    console.log("ERROR in code: ", err);
  });

  dbConnection();

  app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.get("/", (req, res) => res.send("<a href='/auth/google'>Login with Google</a>"));

  app.use("/auth", allRouters.authRoutes);
  app.use("/user", allRouters.userRouter);
  app.use("/categories", allRouters.categoryRouter);
  app.use("/products", allRouters.productRouter);
  app.use("/whatsapp", allRouters.whatsappRouter);
  app.use("/wishlist", allRouters.wishlistRouter);
  app.use("/cart", allRouters.cartRouter);
  app.all("*", (req, res, next) => {
    return res.json({ message: "invalid url" });
  });

  app.use("*", (req, res, next) => {
    next(new AppError(`Route Not Found ${req.originalUrl}`, 404));
  });
  app.use(globalError);

  process.on("unhandledRejection", (err) => {
    console.log("ERROR: ", err);
  });
};
