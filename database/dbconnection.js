import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const dbConnection = () => {
  mongoose
    // .connect(process.env.mongoose_URI)
      .connect(process.env.MONGODB_ATLAS)
    .then(() => {
      console.log("Db connected succesfully..");
    })
    .catch((err) => {
      console.log("Error connecting", err);
    });
};
