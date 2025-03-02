import Category from "../../../database/models/category.model.js";
import Product from "../../../database/models/product.model.js";
import User from "../../../database/models/user.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { messages } from "../../utils/constant/messages.js";
import { ApiFeature } from "../../utils/file-feature.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";

export const addproduct = catchAsyncError(async (req, res, next) => {
  let {
    title,
    description,
    imageCover,
    subImages = [],
    price,
    discount,
    stock,
    category,
  } = req.body;

  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(new AppError(messages.category.notFound, 404));
  }

  // uplods
  let failImages = [];
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.files.imageCover[0].path,
    { folder: "Be-Your-Support/product/imageCover" }
  );
  failImages.push(public_id);
  imageCover = { secure_url, public_id };

  for (const file of req.files.subImages) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      { folder: "Be-Your-Support/product/subImages" }
    );
    subImages.push({ secure_url, public_id });
    failImages.push(public_id);
  }
  // add to database
  let newProduct = new Product({
    title,
    description,
    imageCover, //[{}]
    subImages, //[{},{} ]
    price,
    discount,
    stock,
    category,
    createdBy: req.authUser._id,
    updatedBy: req.authUser._id,
  });
  const createdPro = await newProduct.save();

  if (!createdPro) {
    req.failImages = public_id;
    return next(new AppError(messages.product.failToCreate, 500));
  }
  res.status(201).json({
    message: messages.product.createdSucessfully,
    sucess: true,
    data: newProduct,
  });
});

export const getAllproducts = catchAsyncError(async (req, res, next) => {
  let Products = await Product.find();
  res.status(200).json({ message: "Products are : ", Products });
});

// api feature
export const getproducts = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(Product.find(), req.query)
    .pagination()
    .sort()
    .select()
    .filter();
  const products = await apiFeature.mongooseQuery;
  return res.json({
    message: messages.coupon.fetchedSuccessfully,
    sucess: true,
    data: products,
  });
});

export const getSpeificproduct = catchAsyncError(async (req, res, next) => {
  let { id } = req.params;
  let product = await Product.findById(id);
  if (!product) return next(new AppError(messages.product.notFound, 404));
  res.status(200).json({ message: "Product is : ", data: product });
});

// export const contactProductOwner = catchAsyncError(async (req, res, next) => {

//   const { _id: authUserId, mobileNumber: authUserMobile } = req.authUser; // Authenticated user
//   const { productId } = req.params; // Get product ID from request params

//   // Find product
//   const product = await Product.findById(productId);
//   if (!product) return next(new AppError("Product not found", 404));

//   // Find the user who created the product
//   const productOwner = await User.findById(product.createdBy);
//   if (!productOwner || !productOwner.mobileNumber) {
//     return next(new AppError("Product owner not found", 404));
//   }

//   // Format mobile numbers for WhatsApp
//   const senderPhone = authUserMobile.replace(/\D/g, ""); // Remove non-numeric characters
//   const receiverPhone = productOwner.mobileNumber.replace(/\D/g, "");

//   // Message to send
//   const message = encodeURIComponent(`Hello! I am interested in your product: ${product.title}`);

//   // Generate WhatsApp chat link
//   const whatsappUrl = `https://api.whatsapp.com/send?phone=${receiverPhone}&text=${message}`;

//   res.status(200).json({
//     message: "WhatsApp chat link generated successfully",
//     success: true,
//     chatDetails: {
//       sender: {
//         userId: authUserId,
//         mobileNumber: senderPhone,
//       },
//       receiver: {
//         userId: productOwner._id,
//         mobileNumber: receiverPhone,
//       },
//       whatsappUrl,
//     },
//   });
// });

export const contactProductOwner = catchAsyncError(async (req, res, next) => {
  const { _id: authUserId, mobileNumber: authUserMobile } = req.authUser; // Authenticated user
  const { productId } = req.params; // Get product ID from request params

  // Find product
  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));

  // Find the user who created the product
  const productOwner = await User.findById(product.createdBy);
  if (!productOwner || !productOwner.mobileNumber) {
    return next(new AppError("Product owner not found", 404));
  }

  // Function to format phone numbers with Egypt's country code (+20)
  const formatEgyptianNumber = (number) => {
    let cleanedNumber = number.replace(/\D/g, ""); // this is to remove non-numeric characters
    if (cleanedNumber.startsWith("0")) {
      cleanedNumber = cleanedNumber.substring(1); // this is to remove leading zero
    }
    if (!cleanedNumber.startsWith("20")) {
      cleanedNumber = "20" + cleanedNumber; // this is to add Egypt's country code if missing
    }
    return cleanedNumber;
  };

  // Format both numbers
  const senderPhone = formatEgyptianNumber(authUserMobile);
  const receiverPhone = formatEgyptianNumber(productOwner.mobileNumber);

  // Message to send
  const message = encodeURIComponent(
    `Hello! I am interested in your product: ${product.title}`
  );

  // Generate WhatsApp chat link
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${receiverPhone}&text=${message}`;

  res.status(200).json({
    message: "WhatsApp chat link generated successfully",
    success: true,
    chatDetails: {
      sender: {
        userId: authUserId,
        mobileNumber: senderPhone,
      },
      receiver: {
        userId: productOwner._id,
        mobileNumber: receiverPhone,
      },
      whatsappUrl,
    },
  });
});
