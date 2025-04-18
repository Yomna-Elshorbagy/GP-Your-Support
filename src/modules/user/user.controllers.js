import User from "../../../database/models/user.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { generateOTP } from "../../utils/otp.js";
import { generateToken, verifyToken } from "../../utils/token.js";
import { messages } from "../../utils/constant/messages.js";
import { comparePass, hashedPass } from "../../utils/hash-compare.js";
import { sendEmail, sendResetPasswordMail } from "../../utils/email.js";
import Token from "../../../database/models/token.model.js";
import { status } from "../../utils/constant/enums.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";
import Cart from "../../../database/models/cart.model.js";

// Auth Apis

export const signup = catchAsyncError(async (req, res, next) => {
  //get data from req
  let { userName, email, password, Cpassword, mobileNumber, address } =
    req.body;
  //check exisiting
  const userExisting = await User.findOne({
    $or: [{ email }],
  });
  if (userExisting)
    return next(new AppError(messages.user.alreadyExisist, 409));
  if (password != Cpassword)
    return next(
      new AppError("password annd confirmed password doesnot Match", 401)
    );
  //prepare data
  let image;
  if (req.file) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "Be-Your-Support/user",
      }
    );
    image = { secure_url, public_id };
  }
  const hashedpassword = hashedPass({
    password,
    saltRounds: Number(process.env.SALT_ROUNDS),
  });

  const { otpCode, otpExpire } = generateOTP();
  const user = new User({
    userName,
    email,
    password: hashedpassword,
    address,
    mobileNumber,
    otpCode,
    otpExpire,
    ...(image && { image }),
  });

  let createdUser = await user.save();
  if (!createdUser) return next(new AppError(messages.user.failToCreate, 500));

  // const token = generateToken({
  //   payload: {
  //     _id: createdUser._id,
  //     email: createdUser.email,
  //     password: createdUser.password,
  //   },
  //   secretKey: process.env.EMAIL_KEY,
  // });
  createdUser.password = undefined;
  await sendEmail(createdUser._id, email, otpCode);
  return res.status(201).json({
    message: messages.user.createdSucessfully,
    sucess: true,
    data: createdUser,
  });
});

export const verifyAccount = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const decoded = await verifyToken({
    token,
    secretKey: process.env.EMAIL_KEY,
  });
  if (!decoded || !decoded._id) {
    return next(new AppError("Invalid Token or Signature...", 401));
  }
  const user = await User.findOneAndUpdate(
    { _id: decoded._id, status: status.PENDING },
    {
      status: status.VERIFIED,
      isVerified: true,
      otpCode: null,
      otpExpire: null,
    },
    {
      new: true,
    }
  );
  if (!user) return next(new AppError(messages.user.notFound, 404));
  //create cart when verification
  await Cart.create({ user: user._id, products: [] });
  res.json({
    message: messages.user.verifiedSucessfully,
    sucess: true,
    data: decoded.email,
  });
});

export const verifyOtp = catchAsyncError(async (req, res, next) => {
  const { email, otpCode } = req.body;
  const user = await User.findOne({ email });
  if (!user) return next(new AppError(messages.user.notFound, 404));
  if (user.otpCode !== otpCode)
    return next(new AppError(messages.user.invalidOTP, 401));
  if (user.otpExpire < new Date())
    return next(new AppError(messages.user.expireOTP, 400));
  await User.findOneAndUpdate(
    { email },
    {
      isVerified: true,
      otpCode: null,
      otpExpire: null,
      status: status.VERIFIED,
    },
    { new: true }
  );
  res.json({ message: messages.user.verifiedSucessfully });
});

export const logIn = catchAsyncError(async (req, res, next) => {
  let { email, mobileNumber, password } = req.body;
  //check existance
  const userExist = await User.findOne({
    $or: [{ email }],
    status: status.VERIFIED, //must verfied to login
  });
  if (!userExist) {
    return next(new AppError(messages.user.invalidCredential, 401));
  }
  //check password
  const isMatch = comparePass({
    password: password.trim(),
    hashPass: userExist.password,
  });

  if (!isMatch) {
    return next(new AppError(messages.user.invalidCredential, 401));
  }

  if (userExist.status !== status.VERIFIED || userExist.otpCode != null) {
    return next(new AppError(messages.user.notVerified, 401));
  }

  await User.findByIdAndUpdate(userExist._id, {
    isActive: true,
    status: status.VERIFIED,
  });
  await userExist.save();

  const accessToken = await generateToken({
    payload: {
      userName: userExist.userName,
      _id: userExist._id,
      email: userExist.email,
      role: userExist.role,
    },
  });
  res.json({
    message: messages.user.logedInSucessfully,
    sucess: true,
    accessToken,
  });
});

export const forgetPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const userExist = await User.findOne({ email });
  //check existance
  if (!userExist) return next(new AppError(messages.user.notFound, 404));
  // if has otp
  if (userExist.otpCode && userExist.otpExpire > Date.now()) {
    return next(new AppError(messages.user.hasOTP), 404);
  }
  const { otpCode, otpExpire } = generateOTP();
  //update user OTP;
  userExist.otpCode = otpCode;
  userExist.otpExpire = otpExpire;
  await userExist.save();
  await sendResetPasswordMail(email, otpCode);
  // return res
  return res.json({ message: "check your email", sucess: true });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
  //get data from req
  const { otp, newPass, email } = req.body;
  //check email
  const user = await User.findOne({ email });
  if (!user) return next(new AppError(messages.user.notFound, 404));
  if (user.otpCode !== otp) return next(new AppError(messages.user.invalidOTP));
  if (user.otpExpire < Date.now()) {
    const { otpCode, otpExpire } = generateOTP();
    user.otpCode = otpCode;
    user.otpExpire = otpExpire;
    await user.save();
    await sendResetPasswordMail(email, otpCode);
    return res.status(200).json({ message: "check your email", sucess: true });
  }
  //hash new Password
  const hashPass = hashedPass({ password: newPass });
  await User.updateOne(
    { email },
    {
      password: hashPass,
      otpCode: null,
      otpExpire: null,
      passwordChangedAt: Date.now(),
    }
  );
  await Token.updateMany({ userId: user._id }, { isValid: false });

  return res
    .status(200)
    .json({ message: messages.password.updatedSucessfully, sucess: true });
});

export const logout = catchAsyncError(async (req, res, next) => {
  const { _id } = req.authUser;
  const token = req.headers.ttoken.split(" ")[1];

  await User.findByIdAndUpdate(_id, {
    isActive: false,
  });
  await Token.findOneAndUpdate(
    { token },
    {
      isValid: false,
    }
  );
  res.status(200).json({
    message: messages.user.loggedOutSuccessfully,
    success: true,
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////

// User Api

export const getProfile = catchAsyncError(async (req, res, next) => {
  return res.status(200).json({ message: req.authUser });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword, Cpassword } = req.body;
  const userId = req.authUser._id;

  // Fetch the user again with the password field included
  const user = await User.findById(userId).select("+password");
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  // Compare the provided old password with the hashed password
  const match = comparePass({
    password: oldPassword,
    hashPass: user.password,
  });
  if (!match) return next(new AppError(messages.password.notMatch));

  // Check user status
  if (user.status === !status.VERIFIED || user.otpCode !== null) {
    return next(new AppError(messages.user.notVerified, 401));
  }

  // Confirm new password match
  if (newPassword !== Cpassword)
    return next(new AppError(messages.user.invalidCredential, 401));

  // Hash new password
  const hashPass = hashedPass(newPassword, Number(process.env.SALT_ROUNDS));

  // Update user password
  let updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    {
      password: hashPass,
      passwordChangedAt: Date.now(),
    },
    { new: true }
  );

  // Invalidate all tokens
  await Token.updateMany({ userId: user._id }, { isValid: false });

  updatedUser.password = undefined;

  res.status(200).json({
    message: messages.user.updatedSucessfully,
    success: true,
    data: updatedUser,
  });
});

export const updateUser = catchAsyncError(async (req, res, next) => {
  const id = req.authUser._id;
  const { userName, mobileNumber, address } = req.body;

  const user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    {
      userName,
      mobileNumber,
      address,
    },
    { new: true }
  );

  if (!updatedUser) {
    return next(new AppError(messages.user.failToUpdate, 500));
  }
  updatedUser.password = undefined;
  res.status(200).json({
    message: messages.user.updatedSucessfully,
    sucess: true,
    data: updatedUser,
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.authUser._id;
  const user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const deletedUser = await User.deleteOne(id);
  if (!deletedUser) {
    return next(new AppError(messages.user.failToDelete, 500));
  }
  res
    .status(200)
    .json({ message: messages.user.deletedSucessfully, sucess: true });
});

export const softDeleteUser = catchAsyncError(async (req, res, next) => {
  const id = req.authUser._id;
  const user = await User.findById(id);
  if (!user) return next(new AppError(messages.user.notFound, 404));

  const softDeletedUser = await User.findByIdAndUpdate(
    id,
    { status: status.DELETED },
    { new: true }
  );
  if (!softDeletedUser) {
    return next(new AppError(messages.user.failToDelete, 500));
  }
  softDeletedUser.password = undefined;
  res.status(200).json({
    message: messages.user.deletedSucessfully,
    success: true,
    data: softDeletedUser,
  });
});

//user data with products added
export const getUserWithProducts = catchAsyncError(async (req, res, next) => {
  const userId = req.authUser._id;

  const user = await User.findById(userId)
    .select("-password -otpCode -otpExpire") // exclude sensitive fields
    .populate({
      path: "products",
      select: "-__v -updatedBy", // exclude unwanted fields from products
    });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User data retrieved successfully",
    data: user,
  });
});
