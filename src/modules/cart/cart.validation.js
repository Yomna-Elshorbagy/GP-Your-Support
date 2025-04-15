import joi from "joi";
import { generalFields } from "../../middelwares/validate.js";

export const addToCartVal = joi.object({
  productId: generalFields.objectId.required().messages({
    "any.required": "Product ID is required",
    "custom.invalid": "Invalid Product ID",
  }),
  quantity: joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

export const updateQuantityVal = joi.object({
  id: generalFields.objectId.required().messages({
    "any.required": "Product ID is required",
    "custom.invalid": "Invalid Product ID",
  }),
  quantity: joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

export const deleteFromCartVal = joi.object({
  id: generalFields.objectId.required().messages({
    "any.required": "Product ID is required",
    "custom.invalid": "Invalid Product ID",
  }),
});
