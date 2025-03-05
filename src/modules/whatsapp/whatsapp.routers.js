import { Router } from "express";
import * as whatsappControllers from "../whatsapp/whatsapp.controllers.js";
import { auth, isAuthorized } from "../../middelwares/auth.js";
import { roles } from "../../utils/constant/enums.js";

const whatsappRouter = Router();

//whatsapp APIS
whatsappRouter.post(
  "/track-chat/:productId",
  auth,
  whatsappControllers.trackWhatsAppClick
);

whatsappRouter.get(
  "/chat-history/:sellerId",
  auth,
  whatsappControllers.getChatHistory
);

whatsappRouter.post(
  "/notify-price-drop/:productId",
  auth,
  isAuthorized([roles.USER]),
  whatsappControllers.notifyUsersAboutPriceDrop
);
export default whatsappRouter;
