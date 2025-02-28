import { Types } from "mongoose";
import joi from 'joi';
import { AppError } from "../utils/catch-error.js";

const validateObject = (value, helper)=>{
  const match = Types.ObjectId.isValid(value)
  if(match) {return true}
  return helper('invalid ObjectId')
}

const passPattern = /^[A-Z][A-Za-z0-9]{5,20}$/;
const mobileNumberPattern = /^01[01245]\d{8}$/;

export const generalFields = {
  name : joi.string(),
  email:joi.string().email(),
  password: joi.string().pattern(new RegExp(passPattern)),
  Cpassword: joi.valid(joi.ref('password')),
  mobileNumber: joi.string().pattern(new RegExp(mobileNumberPattern)),
  // objectId : joi.string().hex().length(24),
  objectId: joi.custom(validateObject)
}
export const validate = (schema) => {
  return (req, res, next) => {
    let data = { ...req.body, ...req.params, ...req.query };
    let { error } = schema.validate(data, { abortEarly: false });
    if (!error) {
      next();
    } else {
      let errMsg = error.details.map((err) => err.message);
      next(new AppError(errMsg, 400));
    }
  };
};
