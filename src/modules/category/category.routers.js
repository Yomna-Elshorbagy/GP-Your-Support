import { Router } from "express";
import * as categoryControllers from "./category.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { addCategoryVal, updateCategoryVal } from "./category.validation.js";
import { auth, isAuthorized } from "../../middelwares/auth.js";
import { roles } from "../../utils/constant/enums.js";
import { uploadSingleFile } from "../../utils/fileUpload/multer-cloud.js";

const categoryRouter = Router();

categoryRouter.post(
  "/addCategory",
  auth,
  isAuthorized([roles.USER, roles.ADMIN, roles.VISITOR]),
  uploadSingleFile("image"),
  validate(addCategoryVal),
  categoryControllers.addCategoryCloud
);

categoryRouter.get("/", categoryControllers.getAllCategories);
categoryRouter.get("/getcategories", categoryControllers.getCategories);
categoryRouter.get(
  "/:id/products",
  categoryControllers.getProductsByCategoryId
);
categoryRouter.get(
  "/analytics/trending",
  categoryControllers.getTrendingCategories
);
categoryRouter.get("/analytics/stats", categoryControllers.getCategoryStats);

categoryRouter
  .route("/:id")
  .get(categoryControllers.getSpeificCategory)
  .put(
    auth,
    isAuthorized([roles.USER, roles.ADMIN, roles.VISITOR]),
    uploadSingleFile("image", "categories"),
    validate(updateCategoryVal),
    categoryControllers.updateCategoryCloud
  )
  .delete(
    auth,
    isAuthorized([roles.ADMIN]),
    categoryControllers.deleteCategoryCloud
  );

export default categoryRouter;
