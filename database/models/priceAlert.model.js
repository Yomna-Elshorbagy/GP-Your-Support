import mongoose from "mongoose";

const priceAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  subscribedPrice: { type: Number, required: true }, // Store price at time of subscription
});

export const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);
