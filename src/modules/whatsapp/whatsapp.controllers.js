import nodemailer from "nodemailer";
import Product from "../../../database/models/product.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { messages } from "../../utils/constant/messages.js";
import { sendWhatsAppNotification } from "../../utils/notifications/send-whatsapp.js";
import { PriceAlert } from "../../../database/models/priceAlert.model.js";

export const trackWhatsAppClick = catchAsyncError(async (req, res, next) => {
  const { _id: authUserId } = req.authUser;
  const { productId } = req.params;

  // Check if the product exists
  const product = await Product.findById(productId);
  if (!product) return next(new AppError(messages.product.notFound, 404));

  // Store the interaction in a new collection
  await ChatTracking.create({
    buyer: authUserId,
    product: productId,
    timestamp: new Date(),
  });

  res.status(200).json({
    message: "Chat interaction tracked successfully",
    success: true,
  });
});

// Show Active or Inactive Sellers
export const checkSellerStatus = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const product = await Product.findById(productId).populate(
    "createdBy",
    "status"
  );
  if (!product) return next(new AppError(messages.product.notFound, 404));

  res.status(200).json({
    sellerId: product.createdBy._id,
    status: product.createdBy.status, //"online" or "offline"
  });
});

// WhatsApp Group for Product Discussions: some products may require discussions
export const generateWhatsAppGroup = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;
  const { sellerNumber } = req.body;

  if (!sellerNumber) {
    return next(new AppError("Seller number is required", 400));
  }

  //generate a whatsApp group link
  const groupLink = `https://chat.whatsapp.com/invite/${productId}-${sellerNumber}`;

  res.status(200).json({
    message: "WhatsApp group link generated successfully",
    success: true,
    groupLink,
  });
});

export const getChatHistory = catchAsyncError(async (req, res, next) => {
  const { _id: authUserId } = req.authUser;
  const { sellerId } = req.params;

  const history = await ChatTracking.find({
    buyer: authUserId,
    seller: sellerId,
  }).populate("product", "title");

  res.status(200).json({
    success: true,
    chatHistory: history,
  });
});

export const notifyUsersAboutPriceDrop = catchAsyncError(async (req, res) => {
  try {
    const { productId } = req.params;
    const { oldPrice, newPrice } = req.body;

    if (!oldPrice || !newPrice) {
      return res
        .status(400)
        .json({ error: "oldPrice and newPrice are required." });
    }

    const alerts = await PriceAlert.find({
      product: productId,
      subscribedPrice: { $gt: newPrice },
    }).populate("user");

    if (!alerts.length) {
      return res
        .status(200)
        .json({ message: "No users subscribed for price alerts." });
    }

    const emailList = [];

    for (const alert of alerts) {
      if (alert.user.email) {
        emailList.push(alert.user.email);
      }
      if (alert.user.mobileNumber) {
        await sendWhatsAppNotification(
          alert.user.mobileNumber,
          oldPrice,
          newPrice
        );
      }
    }

    // 🔔 Send Email Notification
    if (emailList.length) {
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.SENDEMAIL,
          pass: process.env.SENDEMAILPASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.SENDEMAIL,
        to: emailList,
        subject: "Price Drop Alert!",
        text: `Good news! The product you subscribed to has dropped in price from $${oldPrice} to $${newPrice}. Check it out now!`,
      };

      await transporter.sendMail(mailOptions);
      console.log(`📩 Sent email notifications to ${emailList.length} users.`);
    }

    res.status(200).json({ message: "Notifications sent successfully" });
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
    res.status(500).json({ error: "Failed to send notifications" });
  }
});
