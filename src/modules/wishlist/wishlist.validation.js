import joi from 'joi';
import { generalFields } from "../../middelwares/validate.js";

export const addWishlistVal = joi.object({
  productId: generalFields.objectId.required(),
});

export const deleteWishlistVal = joi.object({
  productId: generalFields.objectId.required(),
});