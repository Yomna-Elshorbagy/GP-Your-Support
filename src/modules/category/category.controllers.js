import Category from "../../../database/models/category.model.js";
import Product from "../../../database/models/product.model.js";
import { AppError, catchAsyncError } from "../../utils/catch-error.js";
import { messages } from "../../utils/constant/messages.js";
import { ApiFeature } from "../../utils/file-feature.js";
import cloudinary from "../../utils/fileUpload/cloudinary.js";
import { deleteCloud } from "../../utils/fileUpload/file-functions.js";

export const addCategoryCloud = catchAsyncError(async (req, res, next) => {
  let { name } = req.body; //distruct from req
  name = name.toLowerCase(); //toLowerCase
  //check file:
  if (!req.file) {
    return next(new AppError(messages.file.required, 400));
  }
  //check existance:
  const catExist = await Category.findOne({ name }); //{}, null
  if (catExist) {
    return next(new AppError(messages.category.alreadyExisist, 409));
  }
  //prepare data
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: "Be-Your-Support/category",
    }
  );
  const category = new Category({
    name,
    image: { secure_url, public_id },
    createdBy: req.authUser._id,
  });
  //sending to database
  const newCate = await category.save(); //{} null
  if (!newCate) {
    await cloudinary.uploader.destroy(public_id);
    return next(new AppError(messages.category.failToCreate, 500));
  }
  res.status(201).json({
    message: messages.category.createdSucessfully,
    sucess: true,
    data: newCate,
  });
});

export const updateCategoryCloud = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.authUser._id;

  // check category exisist
  const categoryExisist = await Category.findOne({
    _id: id,
    createdBy: userId,
  });
  if (!categoryExisist)
    return next(new AppError(messages.category.notFound, 404));
  // check name exisit
  const nameExisist = await Category.findOne({ name, _id: { $ne: id } });
  if (nameExisist)
    return next(new AppError(messages.category.alreadyExisist, 404));

  //prepare data
  if (name) {
    categoryExisist.name = name;
  }
  //update image
  if (req.file) {
    //replace by override
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      { public_id: categoryExisist.image.public_id }
    );
    categoryExisist.image = { secure_url, public_id };
  }

  let updateCategory = await categoryExisist.save();
  if (!updateCategory) {
    if (req.file) {
      await cloudinary.uploader.destroy(categoryExisist.image.public_id);
    }
    return next(new AppError(messages.category.failToUpdate, 500));
  }
  return res.status(200).json({
    message: messages.category.updatedSucessfully,
    sucess: true,
    data: updateCategory,
  });
});

export const getCategories = catchAsyncError(async (req, res, next) => {
  const apiFeature = new ApiFeature(
    Category.find().populate({
      path: "createdBy",
      select: ["userName", "address", "userName", "mobileNumber", "image"],
    }),
    req.query
  )
    .filter()
    .search();

  const countQuery = new ApiFeature(
    Category.find().populate({
      path: "createdBy",
      select: ["userName", "address", "userName", "mobileNumber", "image"],
    }),
    req.query
  )
    .filter()
    .search();
  const totalDocuments = await countQuery.mongooseQuery.countDocuments();
  apiFeature.pagination().sort().select();

  const category = await apiFeature.mongooseQuery;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.size) || 10;
  const numberOfPages = Math.ceil(totalDocuments / limit);

  return res.json({
    sucess: true,
    results: category.length,
    metadata: {
      currentPage: page,
      numberOfPages,
      limit,
      prevPage: page > 1 ? page - 1 : null,
    },
    category,
  });
});

export const getSpeificCategory = catchAsyncError(async (req, res, next) => {
  let { id } = req.params;
  let category = await Category.findById(id).populate({
    path: "createdBy",
    select: ["userName", "address", "userName", "mobileNumber", "image"],
  });
  category || next(new AppError(messages.category.notFound, 404));
  !category ||
    res.status(200).json({ message: "Category is : ", data: category });
});

export const getAllCategories = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find().populate({
    path: "createdBy",
    select: ["userName", "address", "userName", "mobileNumber", "image"],
  });
  res.status(200).json({ message: "Categories are : ", data: categories });
});

export const deleteCategoryCloud = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  let categoryExisist = await Category.findByIdAndDelete(id);
  if (!categoryExisist)
    return next(new AppError(messages.category.notFound, 404));

  //prepare ids
  const products = await Product.find({ category: id }).select(
    "imageCover subImages"
  );
  const imagePaths = [];
  const productIds = [];
  products.forEach((prod) => {
    imagePaths.push(prod.imageCover);
    imagePaths.push(...prod.subImages);
    productIds.push(prod._id);
  });
  await Product.deleteMany({ _id: { $in: productIds } });

  for (let i = 0; i < imagePaths.length; i++) {
    if (typeof (imagePaths[i] === "string")) {
      deleteCloud(imagePaths[i]);
    } else {
      await cloudinary.uploader.destroy(imagePaths[i].public_id);
    }
  }
  await cloudinary.uploader.destroy(categoryExisist.image.public_id);

  res.status(200).json({
    message: messages.category.deletedSucessfully,
    sucess: true,
  });
});
