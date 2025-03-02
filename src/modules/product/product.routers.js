import { Router } from "express";
import * as productControllers from "./product.controllers.js";
import { roles } from "../../utils/constant/enums.js";
import { auth, isAuthorized } from "../../middelwares/auth.js";
import { uploadMixFiles } from "../../utils/fileUpload/multer-cloud.js";
import { validate } from "../../middelwares/validate.js";
import { addProductVal } from "./product.validation.js";

const productRouter = Router();
productRouter.get("/getproducts", productControllers.getproducts);

productRouter
  .route("/")
  .post(
    auth,
    isAuthorized([roles.USER]),
    uploadMixFiles([
      { name: "imageCover", maxCount: 1 },
      { name: "subImages", maxCount: 8 },
    ]),
    validate(addProductVal),
    productControllers.addproduct
  )
  .get(productControllers.getAllproducts);

productRouter.route("/:id").get(productControllers.getSpeificproduct);
productRouter.get("/contact/:productId", auth, productControllers.contactProductOwner);

export default productRouter;
