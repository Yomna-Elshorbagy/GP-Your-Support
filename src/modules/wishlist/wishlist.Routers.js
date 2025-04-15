import { Router } from "express";
import { auth } from "../../middelwares/auth.js";
import * as wishlistController from "./wishlist.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { addWishlistVal, deleteWishlistVal } from "./wishlist.validation.js";

const wishlistRouter = Router();

wishlistRouter.get('/', auth, wishlistController.getLoggedUserWishlist)
wishlistRouter.put('/', auth,validate(addWishlistVal), wishlistController.addToWishlist)
wishlistRouter.put('/:productId', auth,validate(deleteWishlistVal), wishlistController.deleteWishlist)

export default wishlistRouter;