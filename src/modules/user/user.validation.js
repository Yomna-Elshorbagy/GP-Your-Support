import joi from "joi";
import { generalFields } from "../../middelwares/validate.js";

export const signUpVal = joi
  .object({
    userName: generalFields.name.required(),
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    Cpassword: generalFields.Cpassword.required(),
    mobileNumber: generalFields.mobileNumber.required(),
    address: generalFields.name.required(),
  })
  .required();

export const resetPassVal = joi.object({
  oldPassword: generalFields.password.required(),
  newPassword: generalFields.password.required(),
  Cpassword: joi.valid(joi.ref("newPassword")).required(),
});
