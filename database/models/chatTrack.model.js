import mongoose from "mongoose";

const chatTrackingSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
});

const ChatTracking = mongoose.model("ChatTracking", chatTrackingSchema);
export default ChatTracking;
