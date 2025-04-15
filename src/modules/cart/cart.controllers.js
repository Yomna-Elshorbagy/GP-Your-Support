import Cart from "../../../database/models/cart.model.js";
import Product from "../../../database/models/product.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { messages } from "../../utils/constant/messages.js";

const calcTotalPrice = (items) => {
  items.totalPrice = items.products.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
};
export const addToCart = catchAsyncError(async (req, res, next) => {
  //get data from req
  let { productId, quantity } = req.body;

  //check existance
  const productExisit = await Product.findById(productId);
  if (!productExisit) return next(new AppError(messages.product.notFound, 404));

  //check stock
  if (!productExisit.instock(quantity)) {
    return next(new AppError(messages.product.outStock, 404));
  }
  // check cart
  const userCart = await Cart.findOneAndUpdate(
    {
      user: req.authUser._id,
      "products.productId": productId, //search productId in array of products
    },
    {
      $set: { "products.$.price": productExisit.price },
      $inc: { "products.$.quantity": quantity }, //$ this for updating this product quantity
    },
    {
      new: true,
    }
  );
  // let data = userCart;
  let message = messages.cart.updatedSucessfully;

  if (!userCart) {
    await Cart.findOneAndUpdate(
      { user: req.authUser._id },
      {
        $push: {
          products: { productId, quantity, price: productExisit.price },
        },
      },
      { new: true, upsert: true } // Create the cart if it doesn't exist
    );
    message = messages.cart.createdSucessfully;
  }

  // to calculate total price
  let cartWithDetails = await Cart.findOne({ user: req.authUser._id });
  // .populate({ path: "products.productId", select: "price" });
  calcTotalPrice(cartWithDetails);
  await cartWithDetails.save();

  return res.status(200).json({ message, sucess: true, cart: cartWithDetails });
});

export const deleteFromCart = catchAsyncError(async (req, res, next) => {
  // Get productId from request body
  const { id } = req.params;
  if (!id) {
    return next(new AppError("Product ID is required", 400));
  }
  // Check if the product exists in the cart
  const userCart = await Cart.findOne({
    user: req.authUser._id,
  });
  // .populate({ path: "products.productId", select: "price" });;
  if (!userCart) return next(new AppError(messages.cart.notFound, 404));
  const product = await Cart.findOne({ "products.productId": id });
  if (!product) return next(new AppError("product not in cart"));
  // Remove the product from the cart
  const updatedCart = await Cart.findOneAndUpdate(
    { user: req.authUser._id },
    { $pull: { products: { productId: id } } }, // Remove the product from the products array
    { new: true }
  );
  calcTotalPrice(updatedCart);
  await updatedCart.save();

  return res.status(200).json({
    message: "Product removed from cart",
    success: true,
    data: updatedCart,
  });
});

export const viewCart = catchAsyncError(async (req, res, next) => {
  const userCart = await Cart.findOne({ user: req.authUser._id });

  if (!userCart) {
    return next(new AppError(messages.cart.notFound, 404));
  }

  return res.status(200).json({
    message: "Cart retrieved successfully",
    success: true,
    data: userCart,
  });
});

export const clearCart = catchAsyncError(async (req, res, next) => {
  // find the user's cart & clear the products array
  const updatedCart = await Cart.findOneAndUpdate(
    { user: req.authUser._id },
    { $set: { products: [] } }, // set to an empty array
    { new: true }
  );

  if (!updatedCart) {
    return next(new AppError(messages.cart.notFound, 404));
  }

  return res.status(200).json({
    message: "Cart cleared successfully",
    success: true,
    data: updatedCart,
  });
});

export const updateQuantity = catchAsyncError(async (req, res, next) => {
  let { id } = req.params;
  let { quantity } = req.body;
  let cart = await Cart.findOne({ user: req.authUser._id })
  // .populate({ path: "products.productId", select: "price", });
  if (!cart) return next(new AppError(messages.cart.notFound, 404));
  let item = cart.products.find((item) => item.productId._id == id);
  if (!item) {
    return next(new AppError(messages.product.notFound, 404));
  }
  item.quantity = quantity;
  calcTotalPrice(cart);
  await cart.save();
  return res
    .status(200)
    .json({ message: messages.cart.updatedSucessfully, data: cart });
});
