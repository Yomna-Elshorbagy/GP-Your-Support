import { Router } from "express";
import { auth } from "../../middelwares/auth.js";
import * as cartControllers from "./cart.controllers.js";
import { validate } from "../../middelwares/validate.js";
import { addToCartVal, deleteFromCartVal, updateQuantityVal } from "./cart.validation.js";


const cartRouter = Router();

cartRouter.get('/', auth, cartControllers.viewCart)
cartRouter.post('/', auth,validate(addToCartVal), cartControllers.addToCart)
cartRouter.put('/:id', auth,validate(updateQuantityVal), cartControllers.updateQuantity)
cartRouter.put('/deleteitem/:id',validate(deleteFromCartVal), auth, cartControllers.deleteFromCart)
cartRouter.delete('/', auth, cartControllers.clearCart)

export default cartRouter;