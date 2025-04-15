import { Types } from "mongoose";
import Product from "../../../database/models/product.model.js";
import User from "../../../database/models/user.model.js";
import { messages } from "../../utils/constant/messages.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";

export const addToWishlist = catchAsyncError(async (req, res, next) => {
  //get data from req
  let { productId } = req.body;
  productId = new Types.ObjectId(productId);
  //check Product existance
  const productExist = await Product.findById(productId);
  if (!productExist) {
    return next(new AppError(messages.product.notFound, 404));
  }

  const user = await User.findOneAndUpdate(
    { _id: req.authUser._id },
    { $addToSet: { wishlist: productId } }, //addToSet : to add product only once [insted of $push]
    { new: true }
  );
  return res.status(200).json({
    message: messages.wishlist.createdSucessfully,
    sucess: true,
    data: user.wishlist,
  });
});

export const deleteWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;
  const user = await User.findOneAndUpdate(
    { _id: req.authUser._id },
    { $pull: { wishlist: productId } },
    { new: true }
  ).select("wishlist");
  return res.status(200).json({
    message: messages.wishlist.deletedSucessfully,
    sucess: true,
    data: user,
  });
});

export const getLoggedUserWishlist = catchAsyncError(async (req, res, next) => {
  const userWishlist = await User.findById(
    req.authUser,
    { wishlist: 1 },
    { populate: { path: "wishlist" } }
  );
  return res.status(200).json({ data: userWishlist });
});
